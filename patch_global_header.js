const fs = require('fs');
const path = './app/(tabs)/index.tsx';
let content = fs.readFileSync(path, 'utf8');

// The prompt requests adding a unified Global Header to replace the dashboard greeting and adding it globally.
// "Dans toute l'application (sans aucune régression sur les pages existantes), tu dois implémenter un Header global harmonisé...
// Encapsulation : Place ce Header dans le layout principal ou le conteneur de navigation supérieur (SafeAreaView / HeaderComponent) pour qu'il soit persistant et stable sur l'ensemble des écrans."

// Since the user asked to put it in the layout or safe area view, let's look at `app/(tabs)/_layout.tsx` or create a Header component that gets rendered inside the individual tab screens to prevent safe-area nesting bugs.
