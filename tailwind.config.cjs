/** Compiled by tailwindcss CLI into tw.css — keep in sync with the classes
 * used in app.js / config.js / index.html. Rebuild:
 *   npx tailwindcss@3.4.17 -c tailwind.config.cjs -i tw.in.css -o tw.css --minify
 */
module.exports = Object.assign({content:['./app.js','./config.js','./index.html']}, {
    corePlugins: { preflight: false },
    theme: {
      extend: {
        colors: {
          megara: {
            dark: '#1a0a1f',
            plum: '#2a0f2e',
            wine: '#7a1f3d',
            magenta: '#a02850',
            lavender: '#c9a8d4',
            gold: '#d4a857',
            'gold-dark': '#b8924a'
          },
          parchment: {
            light: '#f4ebd8',
            DEFAULT: '#e8dcc0',
            dark: '#d4c4a0',
            shadow: '#b5a37a'
          },
          abyss: {950:'rgb(var(--mp-abyss-950) / <alpha-value>)',900:'rgb(var(--mp-abyss-900) / <alpha-value>)',850:'rgb(var(--mp-abyss-850) / <alpha-value>)',800:'rgb(var(--mp-abyss-800) / <alpha-value>)',700:'rgb(var(--mp-abyss-700) / <alpha-value>)',600:'rgb(var(--mp-abyss-600) / <alpha-value>)',500:'rgb(var(--mp-abyss-500) / <alpha-value>)'},
          flame: {300:'rgb(var(--mp-flame-300) / <alpha-value>)',400:'rgb(var(--mp-flame-400) / <alpha-value>)',500:'rgb(var(--mp-flame-500) / <alpha-value>)',600:'rgb(var(--mp-flame-600) / <alpha-value>)',700:'rgb(var(--mp-flame-700) / <alpha-value>)'},
          gold: {200:'rgb(var(--mp-gold-200) / <alpha-value>)',300:'rgb(var(--mp-gold-300) / <alpha-value>)',400:'rgb(var(--mp-gold-400) / <alpha-value>)',500:'rgb(var(--mp-gold-500) / <alpha-value>)',600:'rgb(var(--mp-gold-600) / <alpha-value>)',700:'rgb(var(--mp-gold-700) / <alpha-value>)'},
          asphodel: {400:'rgb(var(--mp-asphodel-400) / <alpha-value>)',500:'rgb(var(--mp-asphodel-500) / <alpha-value>)',700:'rgb(var(--mp-asphodel-700) / <alpha-value>)'},
          ember: {300:'rgb(var(--mp-ember-300) / <alpha-value>)',400:'rgb(var(--mp-ember-400) / <alpha-value>)',500:'rgb(var(--mp-ember-500) / <alpha-value>)',600:'rgb(var(--mp-ember-600) / <alpha-value>)'},
          shade: {100:'rgb(var(--mp-shade-100) / <alpha-value>)',200:'rgb(var(--mp-shade-200) / <alpha-value>)',300:'rgb(var(--mp-shade-300) / <alpha-value>)',400:'rgb(var(--mp-shade-400) / <alpha-value>)',500:'rgb(var(--mp-shade-500) / <alpha-value>)'}
        },
        fontFamily: {
          cinzel: ['Cinzel', 'serif'],
          cormorant: ['Cormorant Garamond', 'serif'],
          eb: ['EB Garamond', 'serif'],
          deco: ['Cinzel Decorative', 'Cinzel', 'serif'],
          display: ['Cinzel', 'Georgia', 'serif'],
          goth: ['Pirata One', 'Cinzel', 'serif'],
          script: ['Cormorant Garamond', 'Georgia', 'serif'],
          sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
        },
        boxShadow: {
          soulfire: '0 0 0 1px rgba(91,147,255,0.4), 0 10px 34px -14px rgba(47,111,232,0.6)',
          gilded: '0 0 0 1px rgba(232,181,58,0.32), 0 14px 40px -22px rgba(232,181,58,0.4)',
          pit: '0 30px 70px -34px rgba(0,0,0,0.95)'
        },
        keyframes: {
          drift: {'0%':{transform:'translate3d(-4%, 0, 0) scale(1)',opacity:'0.35'},'50%':{transform:'translate3d(4%, -2%, 0) scale(1.08)',opacity:'0.6'},'100%':{transform:'translate3d(-4%, 0, 0) scale(1)',opacity:'0.35'}},
          flicker: {'0%, 100%':{opacity:'1',transform:'scale(1)'},'38%':{opacity:'0.72',transform:'scale(0.94)'},'62%':{opacity:'0.95',transform:'scale(1.04)'}},
          dance: {'0%, 100%':{transform:'scaleY(1) scaleX(1) skewX(0deg) translateY(0)'},'25%':{transform:'scaleY(1.18) scaleX(0.9) skewX(4deg) translateY(-6%)'},'50%':{transform:'scaleY(0.92) scaleX(1.06) skewX(-3deg) translateY(2%)'},'75%':{transform:'scaleY(1.12) scaleX(0.94) skewX(2deg) translateY(-4%)'}},
          rise: {'0%':{transform:'translateY(0) scale(1)',opacity:'0'},'20%':{opacity:'0.9'},'100%':{transform:'translateY(-70px) scale(0.4)',opacity:'0'}},
          wisp: {'0%':{transform:'translate3d(0, 0, 0) scale(0.7)',opacity:'0'},'15%':{opacity:'0.85'},'50%':{transform:'translate3d(26px, -45vh, 0) scale(1)'},'85%':{opacity:'0.5'},'100%':{transform:'translate3d(-14px, -92vh, 0) scale(0.55)',opacity:'0'}},
          pulse_glow: {'0%, 100%':{opacity:'0.55'},'50%':{opacity:'1'}}
        },
        animation: {
          drift: 'drift 34s ease-in-out infinite',
          'drift-slow': 'drift 52s ease-in-out infinite',
          flicker: 'flicker 2.6s ease-in-out infinite',
          dance: 'dance 1.6s ease-in-out infinite',
          rise: 'rise 6s linear infinite',
          wisp: 'wisp 16s linear infinite',
          'pulse-glow': 'pulse_glow 4s ease-in-out infinite'
        }
      }
    }
  });
