/* Contenuti dei set: modifica qui, la landing si aggiorna da sola.
   - soundcloud: link al singolo set (ora segnaposto sul profilo generico)
   - label: "lime" | "pink" | "marble"  (colore della label del disco)
   - fox: illustrazione sulla label */
window.LOCAMIMI_LINKS = {
  instagram: "https://www.instagram.com/",   // TODO: profilo reale
  soundcloudDefault: "https://soundcloud.com/"
};

window.LOCAMIMI_SETS = [
  {
    id: "soul-thing",
    title: "Soul Thing",
    tag: "Set 01 · house",
    text: "Groove caldi e voci soul sopra una cassa morbida: il set per scaldare la pista.",
    label: "lime",
    fox: "assets/svg/volpe-soul-thing.svg",
    soundcloud: "https://soundcloud.com/"
  },
  {
    id: "groove",
    title: "Groove",
    tag: "Set 02 · hardgroove",
    text: "Percussioni serrate, tom e latin vibes: hardgroove che non si ferma.",
    label: "pink",
    fox: "assets/svg/volpe-groove.svg",
    soundcloud: "https://soundcloud.com/"
  },
  {
    id: "juicy",
    title: "Juicy Thursday",
    tag: "Set 03 · giovedì",
    text: "Il rito del giovedì: house succosa e un po’ di latin per aprire il weekend in anticipo.",
    label: "marble",
    fox: "assets/svg/volpe-juicy-thursday.svg",
    soundcloud: "https://soundcloud.com/"
  }
];
