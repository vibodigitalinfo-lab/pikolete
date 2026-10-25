/**
 * Tiendas y webs muy buscadas en España. Cada una tiene su página /es-fiable/[dominio] enlazada desde el
 * directorio y el sitemap, aunque nadie la haya comprobado todavía: la primera visita (normalmente Googlebot) la crea.
 */
export const POPULAR_STORES: Array<{ category: string; domains: string[] }> = [
  {
    category: "Marketplaces y grandes tiendas",
    domains: [
      "amazon.es",
      "aliexpress.com",
      "temu.com",
      "shein.com",
      "ebay.es",
      "miravia.es",
      "elcorteingles.es",
      "carrefour.es",
      "lidl.es",
      "alcampo.es",
    ],
  },
  {
    category: "Segunda mano",
    domains: ["wallapop.com", "vinted.es", "milanuncios.com", "backmarket.es", "todocoleccion.net"],
  },
  {
    category: "Moda",
    domains: [
      "zara.com",
      "mango.com",
      "zalando.es",
      "primark.com",
      "hm.com",
      "asos.com",
      "bershka.com",
      "pullandbear.com",
      "stradivarius.com",
      "privalia.com",
    ],
  },
  {
    category: "Tecnología",
    domains: ["pccomponentes.com", "mediamarkt.es", "fnac.es", "worten.es", "coolmod.com", "apple.com", "xiaomi.com"],
  },
  {
    category: "Hogar y bricolaje",
    domains: ["ikea.com", "leroymerlin.es", "conforama.es", "maisonsdumonde.com", "bricomart.es", "sklum.com"],
  },
  {
    category: "Deporte",
    domains: ["decathlon.es", "sprinter.es", "jdsports.es", "nike.com", "adidas.es", "forumsport.com"],
  },
  {
    category: "Belleza y perfumería",
    domains: ["druni.es", "primor.eu", "sephora.es", "notino.es", "douglas.es", "lookfantastic.es"],
  },
  {
    category: "Viajes",
    domains: ["booking.com", "edreams.es", "ryanair.com", "vueling.com", "renfe.com", "logitravel.com", "airbnb.es"],
  },
  {
    category: "Mascotas",
    domains: ["tiendanimal.es", "zooplus.es", "kiwoko.com"],
  },
]

export const POPULAR_DOMAINS: string[] = POPULAR_STORES.flatMap((c) => c.domains)
