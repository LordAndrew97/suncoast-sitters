/* ============================================================================
   avatars.js — the illustrated avatars used instead of photographs.

   Eight original flat-geometric drawings of Florida wildlife. They use the
   site's colour variables, so they restyle automatically if you change the
   palette in assets/styles.css.

   TO ASSIGN ONE: in content/sitters.js set   avatar: "heron"
   Valid names: heron, pelican, manatee, turtle, dolphin, flamingo, crab, owl

   Two sitters can share an avatar, but on a small roster it is friendlier to
   give everyone their own — families end up referring to "the heron one".

   These are drawings, not photographs, and that is a deliberate privacy choice.
   See legal/README.md for why.
   ========================================================================== */

window.AVATARS = {

  heron: { label: "Heron", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M88 192v32M108 192v32" stroke="var(--av-line)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M80 224h16M100 224h16" stroke="var(--av-line)" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="92" cy="170" rx="38" ry="25" fill="var(--av-main)"/>' +
    '<path d="M58 178c-16 8-28 6-34-2 14-4 22-10 30-18z" fill="var(--av-main)"/>' +
    '<path d="M100 152c6-30 10-50 18-66" stroke="var(--av-main)" stroke-width="10" stroke-linecap="round" fill="none"/>' +
    '<circle cx="120" cy="78" r="12" fill="var(--av-main)"/>' +
    '<path d="M130 74l44 6-44 8z" fill="var(--av-accent)"/>' +
    '<path d="M112 68c-8-6-14-14-14-22 8 4 14 10 18 18z" fill="var(--av-main)" opacity=".55"/>' +
    '<circle cx="124" cy="75" r="2.8" fill="var(--av-ground)"/>' },

  pelican: { label: "Pelican", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M86 198v24M110 198v24" stroke="var(--av-line)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M78 222h16M102 222h16" stroke="var(--av-line)" stroke-width="5" stroke-linecap="round"/>' +
    '<ellipse cx="90" cy="164" rx="48" ry="36" fill="var(--av-main)"/>' +
    '<path d="M48 148c-16 2-26-6-28-16 14 2 22 0 30-8z" fill="var(--av-main)" opacity=".6"/>' +
    '<path d="M104 132c2-22 10-36 22-42-2 16 0 30 6 40z" fill="var(--av-main)"/>' +
    '<circle cx="120" cy="98" r="24" fill="var(--av-main)"/>' +
    '<path d="M140 90l46 4-46 10z" fill="var(--av-accent)"/>' +
    '<path d="M140 104l42-4c2 22-10 36-28 34-12-2-16-16-14-30z" fill="var(--av-accent)" opacity=".62"/>' +
    '<circle cx="129" cy="92" r="3.4" fill="var(--av-ground)"/>' },

  manatee: { label: "Manatee", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<ellipse cx="94" cy="132" rx="62" ry="44" fill="var(--av-main)"/>' +
    '<path d="M150 118c22-10 34-6 40 4-8 12-22 16-40 8z" fill="var(--av-main)"/>' +
    '<path d="M62 168c-6 18 2 30 14 34-2-14 0-24 8-32z" fill="var(--av-main)"/>' +
    '<path d="M116 170c-4 16 4 26 16 28-4-12-2-20 4-26z" fill="var(--av-main)"/>' +
    '<circle cx="66" cy="120" r="4" fill="var(--av-ground)"/>' +
    '<path d="M44 138c6 4 14 4 20 0" stroke="var(--av-ground)" stroke-width="4" stroke-linecap="round" fill="none"/>' +
    '<circle cx="40" cy="126" r="2.4" fill="var(--av-ground)" opacity=".6"/>' +
    '<circle cx="46" cy="150" r="2.4" fill="var(--av-ground)" opacity=".6"/>' },

  turtle: { label: "Sea turtle", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<ellipse cx="100" cy="140" rx="60" ry="50" fill="var(--av-main)"/>' +
    '<path d="M100 96l24 18-10 28h-28l-10-28z" fill="var(--av-ground)" opacity=".28"/>' +
    '<path d="M60 122l14 22-10 20" fill="none" stroke="var(--av-ground)" stroke-width="3.4" opacity=".28"/>' +
    '<path d="M140 122l-14 22 10 20" fill="none" stroke="var(--av-ground)" stroke-width="3.4" opacity=".28"/>' +
    '<circle cx="100" cy="72" r="21" fill="var(--av-accent)"/>' +
    '<circle cx="92" cy="68" r="3.4" fill="var(--av-ground)"/>' +
    '<circle cx="108" cy="68" r="3.4" fill="var(--av-ground)"/>' +
    '<path d="M46 108c-18-6-30 0-32 12 12 6 24 6 34-2z" fill="var(--av-accent)"/>' +
    '<path d="M154 108c18-6 30 0 32 12-12 6-24 6-34-2z" fill="var(--av-accent)"/>' +
    '<path d="M56 178c-14 8-20 18-14 28 12-2 20-10 24-20z" fill="var(--av-accent)"/>' +
    '<path d="M144 178c14 8 20 18 14 28-12-2-20-10-24-20z" fill="var(--av-accent)"/>' },

  dolphin: { label: "Dolphin", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M28 168C40 118 86 92 134 100c26 4 44 14 54 24-14 10-38 18-66 20-38 4-74 12-94 24z" fill="var(--av-main)"/>' +
    '<path d="M96 100c2-24 12-40 28-46-4 16-4 32 0 44z" fill="var(--av-main)"/>' +
    '<path d="M28 168c-14 2-24 14-24 30 14-4 24-14 30-24z" fill="var(--av-main)"/>' +
    '<path d="M30 156c-14-6-24-2-28 8 12 4 22 4 30-2z" fill="var(--av-main)" opacity=".55"/>' +
    '<path d="M88 142c10 16 12 32 6 44-12-10-18-26-16-42z" fill="var(--av-main)" opacity=".62"/>' +
    '<path d="M180 122c6 2 10 6 8 10-6 0-12-2-16-6z" fill="var(--av-accent)"/>' +
    '<circle cx="158" cy="120" r="3.8" fill="var(--av-ground)"/>' +
    '<path d="M164 132c8 0 14-2 18-4" stroke="var(--av-ground)" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".5"/>' },

  flamingo: { label: "Flamingo", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M96 194v28M116 194v28" stroke="var(--av-line)" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M88 222h16M108 222h16" stroke="var(--av-line)" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="104" cy="168" rx="44" ry="32" fill="var(--av-accent)"/>' +
    '<path d="M74 156c-14-2-24-10-26-20 12 0 22 4 30 12z" fill="var(--av-accent)" opacity=".7"/>' +
    '<path d="M102 140C94 116 124 110 122 86c-1-12-10-18-20-16" stroke="var(--av-accent)" stroke-width="12" stroke-linecap="round" fill="none"/>' +
    '<circle cx="98" cy="72" r="12" fill="var(--av-accent)"/>' +
    '<path d="M89 78l-22 14 20-4z" fill="var(--av-line)"/>' +
    '<circle cx="101" cy="68" r="2.8" fill="var(--av-ground)"/>' },

  crab: { label: "Crab", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M60 168l-26 24M80 178l-16 28M120 178l16 28M140 168l26 24" stroke="var(--av-line)" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M62 150l-24-14M138 150l24-14" stroke="var(--av-line)" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M44 156c8-20 26-32 56-32s48 12 56 32c-14 14-34 22-56 22s-42-8-56-22z" fill="var(--av-main)"/>' +
    '<circle cx="34" cy="130" r="15" fill="var(--av-accent)"/>' +
    '<path d="M24 118l-14-8 12 18z" fill="var(--av-accent)"/>' +
    '<circle cx="166" cy="130" r="15" fill="var(--av-accent)"/>' +
    '<path d="M176 118l14-8-12 18z" fill="var(--av-accent)"/>' +
    '<path d="M86 128v-16M114 128v-16" stroke="var(--av-line)" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="86" cy="106" r="8" fill="var(--av-line)"/>' +
    '<circle cx="114" cy="106" r="8" fill="var(--av-line)"/>' +
    '<circle cx="86" cy="105" r="3" fill="var(--av-ground)"/>' +
    '<circle cx="114" cy="105" r="3" fill="var(--av-ground)"/>' +
    '<path d="M86 160c8 6 20 6 28 0" stroke="var(--av-ground)" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".45"/>' },

  owl: { label: "Owl", svg:
    '<rect width="200" height="250" fill="var(--av-ground)"/>' +
    '<path d="M100 62c34 0 58 28 58 66s-24 62-58 62-58-24-58-62 24-66 58-66z" fill="var(--av-main)"/>' +
    '<path d="M56 74l16 18-24 4z" fill="var(--av-main)"/>' +
    '<path d="M144 74l-16 18 24 4z" fill="var(--av-main)"/>' +
    '<circle cx="78" cy="116" r="22" fill="var(--av-ground)"/>' +
    '<circle cx="122" cy="116" r="22" fill="var(--av-ground)"/>' +
    '<circle cx="80" cy="118" r="9" fill="var(--av-line)"/>' +
    '<circle cx="120" cy="118" r="9" fill="var(--av-line)"/>' +
    '<path d="M100 128l10 14h-20z" fill="var(--av-accent)"/>' +
    '<path d="M100 152c10 10 14 24 12 36h-24c-2-12 2-26 12-36z" fill="var(--av-ground)" opacity=".2"/>' +
    '<path d="M84 190h12M104 190h12" stroke="var(--av-accent)" stroke-width="5" stroke-linecap="round"/>' }
};
