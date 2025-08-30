import imgBiggerLaddare from "../assets/charger/bigger_chargare.webp";
import imgLaddare1 from "../assets/charger/laddare1.webp";
import imgLaddare2 from "../assets/charger/laddare2.webp";
import imgLaddare3 from "../assets/charger/laddare3.webp";
import imgLaddare4 from "../assets/charger/laddare14.webp";
import imgLaddare5 from "../assets/charger/laddare5.webp";
import imgLaddare6 from "../assets/charger/laddare6.webp";
import imgLaddare7 from "../assets/charger/laddare7.webp";
import imgLaddare8 from "../assets/charger/laddare8.webp";
import imgLaddare9 from "../assets/charger/laddare9.webp";
import imgLaddare10 from "../assets/charger/laddare10.webp";
import imgLaddare11 from "../assets/charger/laddare11.webp";
import imgLaddare12 from "../assets/charger/laddare12.webp";
import imgLaddare13 from "../assets/charger/laddare13.webp";
import imgLaddare14 from "../assets/charger/laddare14.webp";
import imgLaddare15 from "../assets/charger/laddare15.webp";
import imgLaddare16 from "../assets/charger/laddare16.webp";
import imgLaddare17 from "../assets/charger/laddare17.webp";
import imgLaddare18 from "../assets/charger/laddare18.webp";
import { desc } from "framer-motion/client";



export default [
  {
    id: "sign-usb-c-20w-white",
    title: "SIGN USB-C PD Laddare 20W – Vit",
    // slug is optional; if you add the slugify helper in catalog it’ll be auto-generated from title
    slug: "sign-usb-c-pd-laddare-20w-vit",

    // Classification
    category: "chargers",
    // categories: ["chargers"], // alternative shape if you prefer arrays
    brand: "SIGN",
    sku: "SIGN-20W-USB-C-WHT",

    // Pricing & stock
    price: 199,
    oldPrice: 249,
    inStock: true,
    isDeal: true,

    // Media
    image: imgLaddare1,
    images: [
      imgBiggerLaddare,
      imgLaddare1,
      imgLaddare2,
      imgLaddare3,
      imgLaddare4,
      imgLaddare5,
      imgLaddare6,
      imgLaddare7,
      imgLaddare8,
      imgLaddare9,
      imgLaddare10,
      imgLaddare11,
      imgLaddare12,
    ],

    // Content
    description: "Kompakt 20W USB-C PD-laddare för iPhone/Android med snabbladdning.",
    longDescription:
      "Snabbladdare på 20W med USB-C Power Delivery (PD). Passar iPhone 8 eller senare och de flesta Android-enheter som stöder PD. Överströmsskydd och temperaturkontroll för säker laddning. EU-kontakt.",

    // Specs (go straight to “Specifications” tab)
    specs: {
      Effekt: "20W",
      Standard: "USB-C PD 3.0",
      Ingång: "100–240V ~ 50/60Hz",
      Utgång: "5V/3A, 9V/2.22A, 12V/1.67A",
      Mått: "42×40×24 mm",
      Vikt: "48 g",
      Färg: "Vit",
      Garanti: "2 år",
      Kompatibilitet: "iPhone, iPad, Android, USB-C enheter"
    },

    // Ratings & marketing
    rating: 4.7,
    tags: ["snabbladdare", "usb-c", "20w"],

    // Facets / attributes used by filters
    attrs: {
      type: "Charger",
      connector: "USB-C",
      cableLength: "No cable"
    }
  }
];