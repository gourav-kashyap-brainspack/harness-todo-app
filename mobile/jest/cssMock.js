// Jest doesn't run Metro's NativeWind CSS transform, so a bare `import
// './global.css'` (side-effect only, no exports used) is mapped here instead
// of being parsed as JS. See jest.config.js `moduleNameMapper`.
module.exports = {};
