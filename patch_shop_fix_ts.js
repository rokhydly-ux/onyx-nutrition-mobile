const fs = require('fs');
let shopContent = fs.readFileSync('app/(tabs)/shop.tsx', 'utf8');

// I replaced <Text ... className="font-bold"> with `<Text style={{ fontFamily: 'Poppins_700Bold' }} ...>` but left a syntax error if I didn't replace exactly.
// Let's use git checkout app/(tabs)/shop.tsx and do the font replacement without regex destroying it.
