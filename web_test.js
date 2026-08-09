// We are building for Web. Does Alert.alert work gracefully on Web blocking/unblocking?
// The user says "ces options ne s'affichent pas". "Le bouton VALIDER LA COMMANDE est inactif".
// On React Native Web, Alert.alert is polyfilled with window.alert/window.confirm, but IT DOES NOT SUPPORT CUSTOM BUTTONS with arrays of 3 options.
// Alert.alert on Web only supports a message and one OK button. If you pass an array of buttons, it ignores them or fails silently on Web!
// This is why the checkout and add-to-cart prompts don't work!

// We must create a custom React Native Modal for the Checkout and the Add to Cart prompt, OR fallback to window.confirm on web.
// But writing a custom modal is better and safer for Expo cross-platform.
