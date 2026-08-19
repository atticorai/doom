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
          abyss: {950:'#04070e',900:'#070c16',850:'#0a111e',800:'#0e1728',700:'#132033',600:'#1a2b42',500:'#233a56'},
          flame: {300:'#a9c8ff',400:'#5b93ff',500:'#2f6fe8',600:'#1f4fc0',700:'#16368a'},
          gold: {200:'#f9ead0',300:'#f0cf72',400:'#e8b53a',500:'#c9962a',600:'#8f6a1c',700:'#5b4415'},
          asphodel: {400:'#8ac6cb',500:'#549aa1',700:'#2c5c62'},
          ember: {300:'#f0a2b3',400:'#e2687f',500:'#c02f4d',600:'#8e1e37'},
          shade: {100:'#e6ecf5',200:'#c0cddd',300:'#93a6bd',400:'#6b7f96',500:'#4c5c73'}
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
