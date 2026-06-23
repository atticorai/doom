// ═══════════════════════════════════════════════════════════════════
// supabase-storage-shim.js — pretends to be firebase.storage(), talks
// to /api/storage (which writes to Supabase Storage with the
// service-role key).
// ═══════════════════════════════════════════════════════════════════
// The app uses firebase.storage() in dozens of places via patterns
// like:
//   storage.ref(path)
//   ref.put(file)                         — async upload, returns task
//   ref.put(file, metadata)               — same, with metadata
//   task.on("state_changed", p, e, c)     — progress callbacks
//   ref.getDownloadURL()                  — Promise<string>
//
// Rewriting every call site on day-1 of the Supabase cutover is risky.
// This shim wears the same API hat — every method the app uses returns
// the same thing the Firebase Storage SDK did, but the data lives in
// Supabase Storage.
//
// Path → bucket routing (deterministic):
//   creative/*       → bucket 'creative', path stripped of 'creative/' prefix
//   ooh-photos/*     → bucket 'ooh',      path becomes 'photos/...'
//   legacy/*         → bucket 'legacy-wk',path stripped of 'legacy/' prefix
//   anything else    → bucket 'creative', path used as-is
//
// Activated by index.html when /api/config returns useSupabase=true.
// ═══════════════════════════════════════════════════════════════════

(function () {
  function bucketAndPath(rawPath) {
    var p = String(rawPath || '');
    if (p.indexOf('creative/') === 0)   return { bucket: 'creative',  path: p.substring(9) };
    if (p.indexOf('ooh-photos/') === 0) return { bucket: 'ooh',       path: 'photos/' + p.substring(11) };
    if (p.indexOf('legacy/') === 0)     return { bucket: 'legacy-wk', path: p.substring(7) };
    return { bucket: 'creative', path: p };
  }

  function callApi(action, body) {
    var payload = Object.assign({ action: action }, body || {});
    return fetch('/api/storage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) {
          var err = new Error((j && (j.error || j.detail)) || ('storage ' + action + ' failed: ' + r.status));
          err.status = r.status;
          err.code = j && j.error;
          throw err;
        }
        return j;
      });
    });
  }

  // ── UploadTask shim ─────────────────────────────────────────────
  // Firebase's task.on("state_changed", progress, error, complete) is
  // the main pattern we have to support. We also have a few `await
  // ref.put(file)` call sites — so the task itself must be thenable.
  //
  // Upload flow: ask /api/storage for a signed upload URL, then PUT
  // the file directly to Supabase via XHR. Direct PUT bypasses
  // Vercel's 4.5MB function payload limit (the app uploads videos)
  // and gives real progress events.
  function createUploadTask(file, _metadata, refInfo) {
    var listeners = { progress: [], error: [], complete: [] };
    var settled = false;
    var settledError = null;
    var snapshot = { bytesTransferred: 0, totalBytes: file ? file.size : 0 };
    var resolveSettled, rejectSettled;
    var donePromise = new Promise(function (res, rej) {
      resolveSettled = res;
      rejectSettled = rej;
    });

    function emitProgress(bytes, total) {
      snapshot = { bytesTransferred: bytes, totalBytes: total };
      listeners.progress.forEach(function (fn) { try { fn(snapshot); } catch (e) {} });
    }
    function emitError(err) {
      settled = true;
      settledError = err;
      listeners.error.forEach(function (fn) { try { fn(err); } catch (e) {} });
      rejectSettled(err);
    }
    function emitComplete() {
      settled = true;
      listeners.complete.forEach(function (fn) { try { fn(); } catch (e) {} });
      resolveSettled(snapshot);
    }

    // Kick off asynchronously so callers can attach listeners first
    // (matches Firebase: ref.put() returns synchronously, then you wire
    // task.on(...) before the upload starts emitting events).
    Promise.resolve().then(function () {
      return callApi('createUploadUrl', {
        bucket: refInfo.bucket,
        path: refInfo.path,
        contentType: file.type || 'application/octet-stream',
      });
    }).then(function (resp) {
      // The file is already in storage (a prior run uploaded it but lost the
      // link). No signed URL to PUT to — just adopt the existing public URL.
      if (resp && resp.alreadyUploaded && !resp.uploadUrl) {
        refInfo._cachedUrl = resp.publicUrl;
        emitProgress(file.size, file.size);
        return Promise.resolve().then(emitComplete);
      }
      return new Promise(function (res, rej) {
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', resp.uploadUrl, true);
        if (file.type) xhr.setRequestHeader('Content-Type', file.type);
        // Supabase signed upload URLs accept upsert via this header.
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.upload.onprogress = function (ev) {
          if (ev.lengthComputable) emitProgress(ev.loaded, ev.total);
        };
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            refInfo._cachedUrl = resp.publicUrl;
            emitProgress(file.size, file.size);
            res();
          } else {
            rej(new Error('Upload PUT failed: ' + xhr.status + ' ' + (xhr.responseText || '').slice(0, 200)));
          }
        };
        xhr.onerror = function () { rej(new Error('Network error during upload')); };
        xhr.onabort = function () { rej(new Error('Upload aborted')); };
        xhr.send(file);
      }).then(emitComplete);
    }).catch(emitError);

    var task = {
      on: function (event, progressCb, errorCb, completeCb) {
        if (event !== 'state_changed') return function () {};
        if (typeof progressCb === 'function') listeners.progress.push(progressCb);
        if (typeof errorCb === 'function') listeners.error.push(errorCb);
        if (typeof completeCb === 'function') listeners.complete.push(completeCb);
        // If we already settled, fire callbacks synchronously to match Firebase behavior.
        if (settled) {
          if (settledError && typeof errorCb === 'function') {
            try { errorCb(settledError); } catch (e) {}
          } else if (!settledError && typeof completeCb === 'function') {
            try { completeCb(); } catch (e) {}
          }
        }
        // Firebase returns an unsubscribe fn; we return a no-op (the app never calls it).
        return function () {};
      },
      get snapshot() { return snapshot; },
      then: function (onFulfilled, onRejected) {
        return donePromise.then(onFulfilled, onRejected);
      },
      catch: function (onRejected) { return donePromise.catch(onRejected); },
    };
    return task;
  }

  // ── Ref shim ───────────────────────────────────────────────────
  function createRef(rawPath) {
    var routed = bucketAndPath(rawPath);
    var refInfo = { bucket: routed.bucket, path: routed.path, rawPath: rawPath, _cachedUrl: null };

    return {
      fullPath: rawPath,
      bucket: routed.bucket,
      put: function (file, metadata) {
        // metadata.customMetadata is informational only in Firebase —
        // the app never reads it back (verified via grep). We accept
        // it for API compatibility and drop it on the floor here.
        return createUploadTask(file, metadata, refInfo);
      },
      getDownloadURL: function () {
        if (refInfo._cachedUrl) return Promise.resolve(refInfo._cachedUrl);
        return callApi('exists', { bucket: refInfo.bucket, path: refInfo.path }).then(function (r) {
          if (!r.exists) {
            var err = new Error('object-not-found');
            err.code = 'storage/object-not-found';
            throw err;
          }
          refInfo._cachedUrl = r.url;
          return r.url;
        });
      },
      delete: function () {
        return callApi('delete', { bucket: refInfo.bucket, path: refInfo.path });
      },
    };
  }

  // Public shim object — mirrors firebase.storage()
  window.__supabaseStorage = {
    ref: function (path) { return createRef(path); },
  };
})();
