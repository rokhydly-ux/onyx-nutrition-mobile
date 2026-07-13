1.  **Analyze user's new images and requirements:** The user uploaded 3 images (`WhatsApp Image 2026-07-13 at 14.44.27 (1).jpeg`, `WhatsApp Image 2026-07-13 at 14.44.27.jpeg`, `image.png`) showing a newly updated onboarding UI flow. I need to update our Expo app to match these designs exactly.
2.  **Update Splash Screen (`app/index.tsx`):**
    *   The new splash screen (`image.png`) features a 3D avatar woman holding a plate of food, surrounded by floating food items (tomatoes, mangoes, blueberries, spinach, etc.).
    *   There is a logo in the middle, and the text "Mincir en mangeant africain" with the green subtitle "Woyofal sa yaram.".
    *   I need to rebuild `app/index.tsx` to match this layout, likely using the full image as a background and overlaying the text, or recreating the layout if it's meant to be an interactive/animated view. Based on the screenshot, it looks like a full-screen image cover with text overlaid.
3.  **Update Welcome / Login Screen (`app/welcome.tsx` or `app/login.tsx`):**
    *   `WhatsApp Image 2026-07-13 at 14.44.27.jpeg` shows a woman cooking, with a bottom gradient/overlay. The text is "Perte de poids, santé ou prise de masse." with the subtitle "Atteins ton objectif sans 'lekk niakh' et en savourant nos plats locaux.".
    *   It has two buttons: a bright green neon button "DIAGNOSTIC GRATUIT" and a black/outline button "SE CONNECTER".
    *   This looks like the new `app/welcome.tsx`.
    *   `WhatsApp Image 2026-07-13 at 14.44.27 (1).jpeg` shows the login flow overlaid on top of a background (looks like food/plantain). It has a back arrow `<-` at the top left.
    *   The text is "Bon retour !" and "Prêt pour ton menu du jour ?".
    *   It uses a white card for input: "Numéro de téléphone" (Ex: 77 123 45 67) and "Code PIN secret" (4 dots).
    *   The button is "C'EST PARTI !".
    *   This looks like the new `app/login.tsx` (using phone + PIN instead of email + password).
4.  **Action Plan:**
    *   I will update `app/welcome.tsx` to match the "Woman cooking" image layout and text. I'll need to find or use a placeholder image for the background if the user hasn't provided the exact asset URLs. I will use the provided screenshots as references.
    *   I will update `app/login.tsx` to match the "Bon retour" phone number + PIN layout.
    *   I will update `app/index.tsx` (Splash screen) to match the 3D avatar splash design.
5.  **Seek Clarifications:** Before I start coding, I will ask the user to confirm this is the direction they want and if they have the specific URLs for the background images (the 3D avatar, the woman cooking, the plantain background), or if they want me to mock them up using the closest available assets or solid colors/gradients for now.
