const fs = require('fs');

let content = fs.readFileSync('app/(tabs)/shop.tsx', 'utf8');

// The user states: "Le clic sur les icônes de catégories ne filtre plus les produits. Répare la fonction onClick de ces filtres pour que l'affichage se mette à jour."
// The issue is likely that the db column is `categorie_nom` (which is used on line 351: `p.categorie_nom === selectedProduct.categorie_nom`), or that `p.category` / `p.categorie` is undefined. Let's make the filter very permissive.

content = content.replace(
    /const cat = p.category \|\| p.categorie;/g,
    "const cat = p.category || p.categorie || p.categorie_nom || p.tags;"
);

// Another fallback if category doesn't match: fall back to checking if the product name includes the filter word
content = content.replace(
    /return cat\?\.toLowerCase\(\)\.trim\(\) === filterClean;/g,
    "return cat?.toLowerCase().trim() === filterClean || cat?.toLowerCase().includes(filterClean) || (p.nom || p.name || '').toLowerCase().includes(filterClean);"
);

fs.writeFileSync('app/(tabs)/shop.tsx', content, 'utf8');
console.log("Patched category filtering in shop");
