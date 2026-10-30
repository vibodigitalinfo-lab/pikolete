/**
 * Guías para compradores. Contenido útil y atemporal que da a Google (y a AdSense) páginas con texto propio,
 * y que lleva al comprobador. Cada bloque es un párrafo o, si es un array, una lista.
 */
export interface Guide {
  slug: string
  title: string
  description: string
  updated: string
  intro: string
  sections: Array<{ title: string; blocks: Array<string | string[]> }>
  faqs: Array<{ q: string; a: string }>
}

export const GUIDES: Guide[] = [
  {
    slug: "estafas-black-friday",
    title: "Black Friday 2026: cómo comprar online sin caer en estafas",
    description:
      "El Black Friday 2026 es el 27 de noviembre. Te contamos las estafas más habituales (tiendas falsas, chollos de redes sociales, SMS de paquetes) y cómo comprobar una tienda antes de pagar.",
    updated: "2026-10-25",
    intro:
      "El Black Friday cae este año el viernes 27 de noviembre y el Cyber Monday el lunes 30. Son los días en que más se compra online y también en los que más tiendas falsas aparecen. La buena noticia es que casi todas se delatan con las mismas señales.",
    sections: [
      {
        title: "Las estafas más habituales en Black Friday",
        blocks: [
          [
            "Tiendas falsas que copian a una marca conocida con un dominio parecido (por ejemplo, la marca seguida de «-outlet» o «-ofertas»).",
            "Anuncios en Instagram, Facebook o TikTok con descuentos del 70 % o el 80 % que llevan a una web recién creada.",
            "SMS o emails de «tu paquete está retenido» que piden pagar uno o dos euros con tarjeta.",
            "Falsos sorteos y cupones que piden tus datos o que instales una aplicación.",
            "Productos muy buscados (consolas, móviles, zapatillas) agotados en todas partes salvo en una tienda desconocida.",
          ],
        ],
      },
      {
        title: "Cinco comprobaciones antes de pagar",
        blocks: [
          [
            "Escribe tú la dirección de la tienda en el navegador en vez de entrar desde un anuncio o un SMS.",
            "Mira cuándo se registró el dominio. Una tienda con pocas semanas de vida y precios de derribo es la combinación más peligrosa.",
            "Busca el aviso legal: en España la tienda debe dar su razón social, su CIF y una dirección.",
            "Busca opiniones fuera de la propia web: «nombre de la tienda + opiniones».",
            "Paga con tarjeta o PayPal. Nunca por transferencia ni por Bizum a una tienda que no conoces.",
          ],
          "Las tres primeras las hace Pikolete por ti en unos segundos con «¿Es fiable esta web?».",
        ],
      },
      {
        title: "Cómo saber si un descuento es real",
        blocks: [
          "Desde 2022, cuando una tienda anuncia una rebaja en España tiene que indicar como precio anterior el más bajo que ha tenido en los 30 días previos. Si un producto «baja» de 199 a 99 euros pero la semana anterior ya costaba 99, la rebaja no es real.",
          "Para comprobarlo puedes usar un comparador con historial de precios o, si ya tenías el producto en la lista de deseos, mirar cuánto costaba hace unas semanas.",
        ],
      },
      {
        title: "Si ya has pagado en una web sospechosa",
        blocks: [
          "Llama a tu banco cuanto antes para bloquear la tarjeta y pedir que retrocedan el cargo. Guarda capturas del pedido, de la web y de los emails, y denúncialo. Tienes los pasos detallados en nuestra guía sobre qué hacer si te han estafado comprando online.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cuándo es el Black Friday 2026?",
        a: "El viernes 27 de noviembre de 2026. El Cyber Monday es el lunes 30 de noviembre. Muchas tiendas alargan las ofertas toda la semana.",
      },
      {
        q: "¿Es seguro comprar en Black Friday?",
        a: "Sí, si compras en tiendas que conoces o que has comprobado antes y pagas con tarjeta o PayPal. El riesgo está en las tiendas nuevas que aparecen solo esos días con precios imposibles.",
      },
      {
        q: "¿Las ofertas de Instagram y TikTok son fiables?",
        a: "Algunas sí, pero es el canal favorito de las tiendas falsas porque pueden pagar anuncios con una web creada hace días. Antes de comprar, copia la dirección de la tienda y compruébala.",
      },
    ],
  },
  {
    slug: "me-han-estafado-comprando-online",
    title: "Me han estafado comprando online: qué hacer paso a paso",
    description:
      "Si has pagado en una tienda falsa o el pedido no llega, actúa rápido: bloquea la tarjeta, pide la devolución del cargo, guarda pruebas y denuncia. Te explicamos cada paso.",
    updated: "2026-10-25",
    intro:
      "Si has comprado en una web que ha desaparecido, el pedido no llega nunca o te ha llegado algo que no tiene nada que ver, no estás solo y hay cosas que puedes hacer. Lo más importante es no perder tiempo.",
    sections: [
      {
        title: "1. Llama a tu banco hoy mismo",
        blocks: [
          "Si pagaste con tarjeta, llama al número de tu banco (el que aparece detrás de la tarjeta o en su app). Pide que bloqueen la tarjeta si diste los datos en una web falsa y que abran una reclamación para retroceder el cargo (en inglés se llama chargeback).",
          "Visa y Mastercard tienen procedimientos para devolver pagos de pedidos que no llegan o que no son lo que se anunciaba. Los plazos varían, pero suelen rondar los 120 días desde la compra, así que cuanto antes, mejor.",
          "Si pagaste con PayPal, abre una disputa desde el Centro de resoluciones. La Protección del Comprador de PayPal cubre durante 180 días los pedidos que no llegan o que son muy distintos de lo anunciado, siempre que no pagaras como «amigos y familiares».",
        ],
      },
      {
        title: "2. Guarda todas las pruebas",
        blocks: [
          [
            "Capturas de la web, del producto y del precio (aunque la web ya no exista, puede que la tengas en el historial o en la caché).",
            "El email o SMS de confirmación del pedido y cualquier conversación con la tienda.",
            "El justificante de pago y el movimiento en tu cuenta.",
            "El anuncio por el que llegaste, si fue en redes sociales.",
          ],
        ],
      },
      {
        title: "3. Denuncia",
        blocks: [
          "Pon una denuncia en la Policía Nacional, la Guardia Civil, los Mossos d'Esquadra o la Ertzaintza. Muchos bancos te la pedirán para tramitar la devolución, y ayuda a que investiguen la web.",
          "También puedes llamar gratis al 017, la línea de ayuda en ciberseguridad del INCIBE. Te orientan sobre qué hacer, sobre todo si has dado datos personales o contraseñas.",
        ],
      },
      {
        title: "4. Si pagaste por transferencia o Bizum",
        blocks: [
          "Es el caso más difícil, porque son pagos que no se pueden anular. Aun así, llama a tu banco inmediatamente: si el dinero todavía no ha salido o la cuenta de destino está en el mismo banco, a veces se puede retener. Después, denuncia con todos los datos de la cuenta o del teléfono al que enviaste el dinero.",
        ],
      },
      {
        title: "5. Si la tienda existe pero no responde",
        blocks: [
          "Si es una empresa real que simplemente no te devuelve el dinero, reclama por escrito y, si no contesta, acude a la oficina de consumo de tu comunidad autónoma. Te lo contamos en la guía sobre cómo reclamar a una tienda online.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿El banco me devuelve el dinero si me han estafado?",
        a: "Si pagaste con tarjeta, el banco puede retroceder el cargo cuando el pedido no llega o no es lo que se anunciaba. No es automático: tienes que reclamar y aportar pruebas. Si diste tú mismo el código de confirmación en una web falsa, el banco puede negarse, pero merece la pena intentarlo.",
      },
      {
        q: "¿Puedo recuperar un Bizum enviado a un estafador?",
        a: "Es muy difícil, porque Bizum es una transferencia inmediata. Avisa a tu banco en el momento y denuncia con el número de teléfono del destinatario.",
      },
      {
        q: "¿Dónde denuncio una web falsa?",
        a: "En la Policía Nacional, la Guardia Civil o la policía autonómica. Para orientación gratuita, llama al 017 del INCIBE.",
      },
    ],
  },
  {
    slug: "como-reclamar-tienda-online",
    title: "Cómo reclamar a una tienda online: devoluciones, garantía y plazos",
    description:
      "Tus derechos al comprar online en España: 14 días para devolver sin dar explicaciones, 3 años de garantía y cómo reclamar si la tienda no responde.",
    updated: "2026-10-25",
    intro:
      "Comprar online en una tienda que opera en España te da los mismos derechos que en una tienda física, y alguno más. Conocerlos ayuda a reclamar con argumentos y a saber cuándo una tienda no está cumpliendo.",
    sections: [
      {
        title: "Derecho de desistimiento: 14 días para devolver",
        blocks: [
          "En las compras a distancia tienes 14 días naturales desde que recibes el pedido para devolverlo sin dar explicaciones. La tienda tiene que devolverte el dinero, incluidos los gastos de envío estándar, en un máximo de 14 días desde que le comunicas que desistes.",
          "Si la tienda no te informó de este derecho, el plazo se alarga hasta 12 meses. Hay excepciones, como los productos personalizados, los perecederos o los precintados de higiene que hayas abierto.",
        ],
      },
      {
        title: "Garantía: 3 años en productos nuevos",
        blocks: [
          "Desde 2022, los productos nuevos tienen 3 años de garantía legal. Si el producto falla, la tienda debe repararlo o cambiarlo y, si no es posible, devolverte el dinero o hacerte una rebaja. Para productos de segunda mano comprados a un profesional, la garantía puede reducirse, pero nunca por debajo de un año.",
        ],
      },
      {
        title: "Cómo reclamar paso a paso",
        blocks: [
          [
            "Escribe a la tienda por email o por su formulario y guarda copia. Explica qué pasó, qué pides (devolución, cambio, reparación) y adjunta el número de pedido.",
            "Si no responde en un plazo razonable, pide la hoja de reclamaciones: las tiendas online también deben ofrecerla.",
            "Presenta la reclamación en la oficina de consumo de tu comunidad autónoma o en la OMIC de tu ayuntamiento.",
            "Si la empresa está adherida, puedes acudir al arbitraje de consumo, que es gratuito y su decisión es vinculante.",
          ],
        ],
      },
      {
        title: "Antes de comprar, mira quién hay detrás",
        blocks: [
          "Todo esto solo sirve si la tienda existe y está identificada. Si en el aviso legal no aparece una empresa con CIF y dirección, no tendrás a quién reclamar. Por eso conviene comprobar la tienda antes de pagar.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cuántos días tengo para devolver una compra online?",
        a: "14 días naturales desde que recibes el pedido, sin tener que justificarlo. Muchas tiendas amplían el plazo, sobre todo en Navidad.",
      },
      {
        q: "¿Quién paga el envío de la devolución?",
        a: "Por ley, el envío de vuelta lo pagas tú salvo que la tienda diga lo contrario. Lo que sí debe devolverte es el envío estándar de ida.",
      },
      {
        q: "¿Qué garantía tiene un producto comprado online?",
        a: "3 años si es nuevo y lo compraste desde el 1 de enero de 2022, igual que en una tienda física.",
      },
    ],
  },
  {
    slug: "sms-paquete-retenido-falso",
    title: "SMS de paquete retenido o aduanas: cómo saber si es falso",
    description:
      "«Tu paquete está retenido, paga 1,99 € para recibirlo». Así funciona la estafa del SMS de paquetería, cómo reconocerla y qué hacer si ya has metido la tarjeta.",
    updated: "2026-10-25",
    intro:
      "Es una de las estafas más extendidas: llega un SMS o un email que parece de Correos, DHL, GLS, SEUR o la propia aduana, dice que tu paquete está retenido y pide pagar una pequeña cantidad. El objetivo no es el euro y pico, sino los datos de tu tarjeta.",
    sections: [
      {
        title: "Cómo es el mensaje",
        blocks: [
          [
            "Habla de un paquete retenido, una dirección incompleta o unas tasas de aduana pendientes.",
            "Pide un pago pequeño (1 a 3 euros) para que no sospeches.",
            "Mete prisa: «si no pagas en 24 horas, el paquete será devuelto».",
            "Incluye un enlace a una web con un dominio raro o con el nombre de la empresa mezclado con otras palabras.",
          ],
        ],
      },
      {
        title: "Cómo comprobar si es real",
        blocks: [
          "No pulses el enlace. Si de verdad esperas un paquete, entra tú mismo en la web oficial de la empresa escribiendo la dirección o en su app, y busca el envío con el número de seguimiento que te dio la tienda.",
          "Si quieres saber qué hay detrás del enlace sin abrirlo, copia la dirección (mantén pulsado el enlace y elige copiar) y pégala en «¿Es fiable esta web?». Las webs de este tipo suelen tener días de vida.",
        ],
      },
      {
        title: "Si ya has metido los datos de la tarjeta",
        blocks: [
          "Llama a tu banco para bloquear la tarjeta y revisa los movimientos. Es habitual que te pidan después un código por SMS «para confirmar el pago»: no lo des, porque sirve para autorizar compras mucho mayores. Denuncia y, si tienes dudas, llama gratis al 017 del INCIBE.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Correos cobra tasas de aduana por SMS?",
        a: "Los paquetes de fuera de la UE pueden tener IVA y tasas reales, pero nunca pagues desde un enlace recibido por SMS. Comprueba el envío en la web o la app oficial escribiendo tú la dirección.",
      },
      {
        q: "He pulsado el enlace pero no he pagado, ¿pasa algo?",
        a: "Normalmente no, si no has introducido datos ni instalado nada. Cierra la página, borra el mensaje y no respondas.",
      },
    ],
  },
  {
    slug: "pagar-con-bizum-paypal-o-tarjeta",
    title: "¿Bizum, PayPal o tarjeta? Cuál es más seguro para comprar online",
    description:
      "No todas las formas de pago te protegen igual si algo sale mal. Comparamos tarjeta, PayPal, Bizum, transferencia y contra reembolso, y explicamos si se puede pasar dinero de Bizum a PayPal.",
    updated: "2026-10-30",
    intro:
      "Cuando una compra sale mal, la forma de pago decide si recuperas el dinero o no. Antes de pagar en una tienda que no conoces, merece la pena elegir bien.",
    sections: [
      {
        title: "Tarjeta de crédito o débito",
        blocks: [
          "Es de las opciones más seguras: si el pedido no llega o no es lo que se anunciaba, tu banco puede retroceder el cargo. Además, la autenticación reforzada (el código o la confirmación en la app) dificulta que usen tu tarjeta sin permiso. Para comprar en tiendas nuevas, una tarjeta virtual o prepago con el saldo justo añade otra capa de seguridad.",
        ],
      },
      {
        title: "PayPal",
        blocks: [
          "La Protección del Comprador cubre los pedidos que no llegan o que son muy distintos de lo anunciado, con 180 días para abrir una disputa. Además, la tienda no ve los datos de tu tarjeta. Ojo: si pagas como «amigos y familiares», no hay protección. Desconfía de cualquier vendedor que te lo pida.",
        ],
      },
      {
        title: "Bizum",
        blocks: [
          "Bizum entre particulares es una transferencia inmediata: no se puede anular ni reclamar como un pago con tarjeta. Es cómodo para pagar a amigos, pero no para comprar a desconocidos. Algunas tiendas aceptan Bizum como pasarela de pago, con condiciones distintas según el banco; si dudas, usa tarjeta.",
        ],
      },
      {
        title: "¿Se puede pasar dinero de Bizum a PayPal?",
        blocks: [
          "No directamente. Bizum funciona entre cuentas de bancos españoles y PayPal es un monedero aparte, así que no puedes enviar un Bizum a una cuenta de PayPal ni al revés. Lo habitual es dar un rodeo por tu banco: el Bizum llega a tu cuenta bancaria y, si la tienes vinculada a PayPal, desde ahí pagas o recargas saldo. Para sacar dinero de PayPal, lo retiras a esa misma cuenta y luego ya puedes enviarlo por Bizum.",
          "Si un vendedor te propone «pásame un Bizum y te lo devuelvo por PayPal» o al revés, desconfía: mezclar los dos sistemas suele ser la forma de que pagues por una vía sin protección. Y si alguien te pide un Bizum para «recibir» dinero, no lo aceptes: con Bizum se recibe sin hacer nada, nunca hace falta confirmar un pago para cobrar.",
        ],
      },
      {
        title: "Transferencia y otros",
        blocks: [
          "La transferencia bancaria, Western Union o las criptomonedas son las formas de pago favoritas de los estafadores, precisamente porque el dinero no vuelve. Una tienda que solo acepta estas opciones es una señal de alarma.",
          "El contra reembolso es seguro para el dinero (pagas al recibir), aunque no te garantiza que dentro del paquete esté lo que pediste.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Qué forma de pago es más segura para comprar online?",
        a: "Tarjeta o PayPal (sin la opción «amigos y familiares»), porque permiten reclamar el dinero si el pedido no llega.",
      },
      {
        q: "¿Es seguro pagar con Bizum a una tienda?",
        a: "Entre particulares no tienes protección: el dinero no se puede recuperar. Úsalo solo con personas o tiendas que conozcas.",
      },
      {
        q: "¿Puedo enviar dinero de Bizum a PayPal?",
        a: "No directamente: son sistemas separados. El dinero tiene que pasar por tu cuenta bancaria, que puedes vincular a PayPal para pagar o recargar saldo.",
      },
    ],
  },
  {
    slug: "son-fiables-temu-shein-aliexpress",
    title: "¿Son fiables Temu, Shein y AliExpress? Lo que debes saber antes de comprar",
    description:
      "Temu, Shein y AliExpress son empresas reales, pero comprar en ellas tiene particularidades: plazos, devoluciones, IVA y webs falsas que se hacen pasar por ellas.",
    updated: "2026-10-25",
    intro:
      "Temu, Shein y AliExpress son plataformas reales y muy grandes, con millones de pedidos en España. No son estafas, pero conviene conocer cómo funcionan para no llevarse sorpresas, y sobre todo cuidado con las webs que se hacen pasar por ellas.",
    sections: [
      {
        title: "Lo que conviene saber",
        blocks: [
          [
            "Plazos: muchos productos salen de almacenes en Asia y pueden tardar varias semanas. Mira el plazo estimado antes de pagar.",
            "Vendedores: en AliExpress y en parte de Temu vendes a terceros a través de la plataforma. Mira las valoraciones del vendedor, no solo las del producto.",
            "Devoluciones: las tres ofrecen devoluciones, pero las condiciones cambian según el producto y el vendedor. Léelas antes de comprar algo caro.",
            "IVA: desde julio de 2021 todas las compras de fuera de la UE pagan IVA. Normalmente ya va incluido en el precio final.",
            "Calidad y seguridad: con juguetes, cargadores y cosméticos, fíjate en que lleven marcado CE y en las opiniones con fotos.",
          ],
        ],
      },
      {
        title: "Cuidado con las copias",
        blocks: [
          "Lo peligroso no suelen ser las plataformas, sino las webs y anuncios que usan su nombre: «outlet de Shein», cupones de Temu que piden datos o perfiles en redes que dicen regalar productos. Entra siempre escribiendo la dirección oficial o desde la app oficial.",
          "Puedes consultar la ficha de cada una en Pikolete, y comprobar cualquier otra web que diga ser de estas marcas.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Es seguro comprar en Temu?",
        a: "Temu es una plataforma real. Los riesgos habituales son la calidad de algunos productos y los plazos, no que te roben el dinero. Paga dentro de la app o la web oficial y desconfía de cupones que llegan por mensaje.",
      },
      {
        q: "¿Shein es una estafa?",
        a: "No, es una tienda real. Lo que sí abunda son webs falsas que usan su nombre y su estética, así que comprueba que estás en el dominio oficial.",
      },
      {
        q: "¿Hay que pagar aduana en AliExpress?",
        a: "Normalmente el IVA ya va incluido en el precio al pagar. Si te llega un SMS pidiendo tasas de aduana, compruébalo en la web oficial de la empresa de transporte antes de pagar nada.",
      },
    ],
  },
]

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug)
