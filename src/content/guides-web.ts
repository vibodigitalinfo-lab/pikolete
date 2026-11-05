import type { Guide } from "@/content/guides"

/**
 * Guías para quien tiene una web: explican con calma lo que revisa el auditor (title, velocidad, HTTPS…).
 * Texto propio y útil por sí mismo, sin depender de pasar la inspección.
 */
export const WEB_GUIDES: Guide[] = [
  {
    slug: "auditoria-seo-paso-a-paso",
    topic: "web",
    title: "Cómo hacer una auditoría SEO de tu web paso a paso (y gratis)",
    description:
      "Qué revisar en una auditoría SEO básica, en qué orden y con qué herramientas gratuitas: indexación, títulos, contenido, velocidad, móvil y HTTPS. Guía práctica para pequeños negocios.",
    updated: "2026-11-05",
    intro:
      "Una auditoría SEO no es más que una revisión ordenada de todo lo que puede impedir que Google encuentre, entienda y muestre tu web. No hace falta ser técnico ni pagar una agencia para hacer la primera: con una tarde, una lista como esta y herramientas gratuitas puedes detectar los fallos que más tráfico te están quitando.",
    sections: [
      {
        title: "1. Comprueba que Google puede ver tu web",
        blocks: [
          "Antes de pensar en palabras clave, asegúrate de que tu web está indexada. Escribe en Google site:tudominio.com y mira cuántas páginas aparecen. Si no sale ninguna o faltan las importantes, el problema no es de posicionamiento, sino de acceso.",
          [
            "Revisa el archivo robots.txt (tudominio.com/robots.txt): no debe bloquear las páginas que quieres que aparezcan.",
            "Busca etiquetas «noindex» olvidadas. Muchos WordPress las dejan activas si al crear la web se marcó «Disuadir a los motores de búsqueda».",
            "Ten un sitemap.xml y envíalo en Google Search Console, la herramienta gratuita de Google para propietarios de webs.",
            "Comprueba que cada página tiene una URL canónica clara y que no existen dos versiones de la web (con y sin www, o con http y https) sin redirección entre ellas.",
          ],
        ],
      },
      {
        title: "2. Revisa títulos, descripciones y encabezados",
        blocks: [
          "El título de la página (la etiqueta title) es el texto azul que se ve en Google y uno de los factores que más pesan. Cada página debe tener uno propio, que diga de qué trata en unos 50 o 60 caracteres. La meta description no influye directamente en el posicionamiento, pero sí en cuánta gente hace clic.",
          "Dentro de la página, debe haber un único encabezado principal (H1) y subtítulos (H2, H3) que ordenen el contenido. Los buscadores y los lectores de pantalla usan esa estructura para entender el texto. Tienes más detalles en nuestra guía sobre cómo escribir el title y la meta description.",
        ],
      },
      {
        title: "3. Mira el contenido con ojos de cliente",
        blocks: [
          "La parte técnica abre la puerta, pero lo que posiciona es responder bien a lo que la gente busca. Repasa tus páginas principales y pregúntate si alguien que llega desde Google encuentra en pocos segundos lo que necesita: qué ofreces, dónde, a qué precio y cómo contactar.",
          [
            "Evita páginas casi vacías o con el mismo texto repetido cambiando solo el nombre de la ciudad o del producto.",
            "Añade un texto alternativo (atributo alt) a las imágenes que aportan información: ayuda a la accesibilidad y a Google Imágenes.",
            "Enlaza entre tus propias páginas con textos descriptivos («ver tarifas de fontanería»), no con «pincha aquí».",
            "Actualiza o une las páginas antiguas que ya no sirven en lugar de dejarlas olvidadas.",
          ],
        ],
      },
      {
        title: "4. Velocidad y móvil",
        blocks: [
          "Google usa la versión móvil de tu web para decidir cómo posicionarla, y más de la mitad de las visitas suelen llegar desde el teléfono. Abre tu web en el móvil con datos (no con wifi) y comprueba que se lee sin hacer zoom, que los botones se pulsan con facilidad y que carga en pocos segundos.",
          "Para medirlo con números, PageSpeed Insights de Google te da las métricas Core Web Vitals. Si la web va lenta, en nuestra guía de velocidad tienes los arreglos más habituales ordenados de más fácil a más difícil.",
        ],
      },
      {
        title: "5. Seguridad: HTTPS y cabeceras",
        blocks: [
          "Una web sin candado en el navegador asusta a los visitantes y Google la marca como «No segura». Hoy el certificado SSL es gratuito en casi cualquier alojamiento, así que no hay motivo para no tenerlo. Además, conviene que todas las direcciones con http redirijan a https y que el servidor envíe algunas cabeceras de seguridad básicas.",
        ],
      },
      {
        title: "6. Apunta, prioriza y repite",
        blocks: [
          "Al terminar tendrás una lista de fallos. No intentes arreglarlo todo a la vez: empieza por lo que impide la indexación, sigue por títulos y contenido de las páginas que más venden y deja para el final los detalles técnicos menores. Repite la revisión cada pocos meses o después de cada cambio grande en la web, como un rediseño o un cambio de alojamiento.",
          "El inspector de Pikolete hace en unos segundos la parte automática de esta lista (26 controles de SEO, velocidad, seguridad y estructura) y te explica cada fallo. La parte de contenido, la de ponerse en la piel del cliente, sigue siendo cosa tuya.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cada cuánto debo hacer una auditoría SEO?",
        a: "Para una web pequeña basta con una revisión completa cada tres o seis meses, y una rápida después de cualquier cambio importante: rediseño, cambio de plantilla, de dominio o de alojamiento.",
      },
      {
        q: "¿Una herramienta automática sustituye a un profesional?",
        a: "No del todo. Las herramientas detectan muy bien los fallos técnicos, pero no pueden juzgar si tu contenido responde mejor que el de tu competencia ni elegir la estrategia de palabras clave. Para empezar, sin embargo, cubren la mayoría de los problemas habituales.",
      },
      {
        q: "¿Cuánto tarda en notarse una mejora en Google?",
        a: "Depende de lo que arregles. Desbloquear una página que no estaba indexada puede notarse en días; mejorar contenidos o enlaces suele tardar semanas o meses en reflejarse en el tráfico.",
      },
    ],
  },
  {
    slug: "title-y-meta-description",
    topic: "web",
    title: "Title y meta description: cómo escribirlos para conseguir más clics en Google",
    description:
      "Qué son la etiqueta title y la meta description, qué longitud deben tener, errores habituales y ejemplos reales para tiendas, negocios locales y blogs.",
    updated: "2026-11-05",
    intro:
      "Cuando alguien busca en Google, lo primero que ve de tu web no es tu diseño, sino dos líneas de texto: el título y la descripción. De ellas depende que haga clic en tu resultado o en el de al lado. Escribirlas bien es de las mejoras SEO más baratas que existen: no requiere programar y se nota en las visitas.",
    sections: [
      {
        title: "Qué es cada cosa",
        blocks: [
          "La etiqueta title es el título de la página en el código HTML. Aparece en la pestaña del navegador y, normalmente, como el enlace azul del resultado de Google. Es una de las señales que Google usa para saber de qué trata la página.",
          "La meta description es un resumen de la página. Google no la usa para posicionar, pero suele mostrarla debajo del título. Si está bien escrita, convence; si falta o no encaja con la búsqueda, Google elige por su cuenta un trozo de texto de la página, que no siempre es el mejor.",
        ],
      },
      {
        title: "Cómo escribir un buen title",
        blocks: [
          [
            "Uno distinto para cada página. Si todas se llaman «Inicio · Mi empresa», Google no sabe cuál mostrar.",
            "Pon al principio lo que la gente busca: el producto, el servicio o la pregunta que resuelves.",
            "Unos 50 o 60 caracteres. Google corta los títulos por anchura en píxeles, así que a partir de ahí es probable que veas puntos suspensivos.",
            "El nombre de tu marca, si cabe, al final y separado con un guion o un punto medio.",
            "Nada de repetir palabras clave («fontanero Valencia, fontanero barato Valencia, fontanero 24h Valencia»): parece spam y Google puede reescribirlo.",
          ],
          "Ejemplo para un negocio local: «Fontanero en Valencia 24 horas · Presupuesto gratis | Aguas Turia». Ejemplo para una ficha de producto: «Zapatillas de trail mujer Modelo X, talla 36 a 42 | Tienda Y».",
        ],
      },
      {
        title: "Cómo escribir una buena meta description",
        blocks: [
          [
            "Entre 120 y 160 caracteres, para que se vea entera en la mayoría de pantallas.",
            "Explica qué va a encontrar la persona y por qué tu página es la mejor opción: precio, plazo, zona, garantía.",
            "Incluye la búsqueda principal de forma natural: Google la resalta en negrita cuando coincide.",
            "Termina con una invitación clara: «Pide presupuesto», «Mira las tallas», «Lee la guía».",
            "No copies la misma descripción en todas las páginas.",
          ],
          "Ejemplo: «Reparamos fugas, calentadores y atascos en Valencia en menos de 2 horas. Presupuesto sin compromiso y garantía de 1 año. Llámanos ahora.»",
        ],
      },
      {
        title: "Errores que vemos a menudo",
        blocks: [
          [
            "Páginas sin title o con el nombre del archivo («index», «pagina-nueva-2»).",
            "Títulos que prometen algo que la página no cumple. Aumentan los clics un día y la gente se va al instante, que es justo lo contrario de lo que quieres.",
            "La misma meta description en toda la web, heredada de la plantilla.",
            "Fechas antiguas en el título («Ofertas 2023») que hacen parecer abandonada la página.",
          ],
        ],
      },
      {
        title: "Cómo cambiarlos en tu web",
        blocks: [
          "En WordPress, los plugins de SEO más usados añaden debajo de cada página un recuadro para escribir el título y la descripción. En Shopify, Wix o Squarespace hay un apartado de «SEO» o «Vista previa en buscadores» en la configuración de cada página o producto. Si tu web está hecha a mano, son las etiquetas <title> y <meta name=\"description\"> del <head>.",
          "Después de cambiarlos, Google tarda unos días en volver a pasar por la página. Puedes pedir que la revise antes desde Google Search Console con la herramienta de inspección de URLs. Para comprobar que están bien puestos en todas tus páginas, pasa la web por el inspector de Pikolete: avisa si faltan, si están duplicados o si son demasiado largos.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Por qué Google muestra un título distinto al que he puesto?",
        a: "Google reescribe los títulos cuando cree que no describen bien la página: si son demasiado largos, si repiten palabras clave o si no coinciden con el contenido. Un título claro y honesto suele respetarse.",
      },
      {
        q: "¿La meta description ayuda a posicionar?",
        a: "No directamente. Su valor está en convencer a la gente para que haga clic, y más clics de personas que se quedan en tu página sí son buena señal.",
      },
      {
        q: "¿Debo poner el nombre de mi empresa en todos los títulos?",
        a: "Es recomendable si cabe, al final. En la página de inicio puede ir delante, porque ahí es lo que la gente busca.",
      },
    ],
  },
  {
    slug: "mejorar-velocidad-web",
    topic: "web",
    title: "Mi web va lenta: cómo mejorar la velocidad paso a paso",
    description:
      "Por qué tu web carga despacio y cómo arreglarlo: imágenes, alojamiento, caché, plugins y Core Web Vitals (LCP, INP y CLS) explicados sin tecnicismos.",
    updated: "2026-11-05",
    intro:
      "Una web lenta pierde visitas antes de que nadie lea una sola línea: si tarda más de tres segundos en el móvil, mucha gente vuelve atrás y entra en el siguiente resultado. Además, la velocidad forma parte de las señales de experiencia de página que tiene en cuenta Google. La buena noticia es que los problemas suelen ser siempre los mismos.",
    sections: [
      {
        title: "Primero, mide",
        blocks: [
          "Abre PageSpeed Insights, pega la dirección de tu web y mira el apartado de móvil. Te dará tres métricas llamadas Core Web Vitals:",
          [
            "LCP (Largest Contentful Paint): cuánto tarda en verse el elemento principal, normalmente la imagen grande o el titular. Bueno: menos de 2,5 segundos.",
            "INP (Interaction to Next Paint): cuánto tarda la página en reaccionar cuando pulsas algo. Bueno: menos de 200 milisegundos.",
            "CLS (Cumulative Layout Shift): cuánto se mueven las cosas mientras carga, ese botón que se desplaza justo cuando ibas a pulsarlo. Bueno: menos de 0,1.",
          ],
          "Mide la página de inicio y también una página interior típica, como un producto o un artículo: a veces la lenta no es la que imaginas.",
        ],
      },
      {
        title: "Las imágenes, el sospechoso habitual",
        blocks: [
          "En la mayoría de webs pequeñas, más de la mitad del peso son imágenes subidas tal cual salen de la cámara o del móvil, con varios megas cada una.",
          [
            "Redimensiónalas al tamaño al que se muestran. Una foto de 4.000 píxeles de ancho para un hueco de 800 es peso desperdiciado.",
            "Usa formatos modernos como WebP o AVIF, que pesan mucho menos que JPG o PNG con la misma calidad.",
            "Activa la carga diferida (lazy loading) para las imágenes que quedan más abajo, pero no para la imagen principal de arriba del todo.",
            "Indica el ancho y el alto de cada imagen en el código para que el navegador reserve su hueco y la página no salte (mejora el CLS).",
          ],
        ],
      },
      {
        title: "El servidor y la caché",
        blocks: [
          "Si el servidor tarda más de medio segundo en empezar a responder, todo lo demás llega tarde. El inspector de Pikolete mide ese tiempo de respuesta en cada revisión. Las causas más comunes son un alojamiento compartido muy barato y saturado, o una web que genera cada página desde cero en cada visita.",
          [
            "Activa una caché de páginas. En WordPress hay plugins gratuitos que lo hacen en un par de clics, y muchos alojamientos la incluyen.",
            "Comprueba que el servidor comprime el HTML, el CSS y el JavaScript con gzip o Brotli.",
            "Si tus clientes están en España y tu servidor en otro continente, plantéate un alojamiento más cercano o una CDN.",
          ],
        ],
      },
      {
        title: "Plugins, scripts y fuentes",
        blocks: [
          "Cada chat, mapa, carrusel, píxel de publicidad o fuente tipográfica añade código que el navegador tiene que descargar y ejecutar. Haz inventario y quita lo que no uses. En WordPress, desactiva y borra los plugins que ya no necesitas; a menudo hay tres que hacen lo mismo.",
          "Limita las fuentes a una o dos familias y pocos grosores. Y si insertas vídeos de YouTube, valora mostrar una imagen que cargue el reproductor solo cuando alguien pulse en ella.",
        ],
      },
      {
        title: "Qué hacer primero",
        blocks: [
          "Si no sabes por dónde empezar, este orden suele dar el mayor resultado con el menor esfuerzo: comprimir imágenes, activar la caché, quitar plugins y scripts que sobran y, si aun así el servidor es lento, cambiar de plan o de alojamiento. Después de cada cambio vuelve a medir para saber qué ha funcionado.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cuánto debe tardar en cargar una web?",
        a: "Como referencia, que el contenido principal se vea en menos de 2,5 segundos en un móvil normal. Por debajo de eso, la mayoría de visitantes no percibe la web como lenta.",
      },
      {
        q: "¿Por qué PageSpeed me da una nota distinta cada vez?",
        a: "La prueba de laboratorio varía según la carga del servidor y la red en ese momento. Fíjate en la tendencia y, si tu web tiene suficientes visitas, en los datos de usuarios reales que aparecen arriba del informe.",
      },
      {
        q: "¿Un alojamiento más caro siempre es más rápido?",
        a: "No siempre, pero un alojamiento compartido muy barato y saturado es una causa frecuente de lentitud que ninguna optimización arregla del todo. Si el tiempo de respuesta del servidor es alto incluso con caché, el problema está ahí.",
      },
    ],
  },
  {
    slug: "certificado-ssl-https",
    topic: "web",
    title: "Certificado SSL y HTTPS: qué es, por qué lo necesitas y cómo activarlo gratis",
    description:
      "Qué es un certificado SSL, por qué Chrome marca tu web como «No segura» y cómo activar HTTPS gratis, redirigir http a https y evitar el contenido mixto.",
    updated: "2026-11-05",
    intro:
      "El candado que aparece junto a la dirección de una web indica que la conexión va cifrada con HTTPS gracias a un certificado SSL (hoy, técnicamente, TLS). Sin él, los navegadores avisan de que la página «No es segura», los formularios pueden enviarse sin proteger y muchos visitantes se marchan. Activarlo es gratis y suele llevar pocos minutos.",
    sections: [
      {
        title: "Qué hace exactamente el certificado",
        blocks: [
          "Cifra la información que viaja entre el navegador del visitante y tu servidor, de modo que nadie en medio (por ejemplo, en una wifi pública) pueda leer ni modificar lo que se envía: contraseñas, datos de un formulario o el contenido de la propia página.",
          "Ojo con una confusión habitual: el candado no significa que una web sea honrada, solo que la conexión está cifrada. Las webs fraudulentas también tienen certificado, porque es gratis. Por eso en nuestro comprobador de tiendas el HTTPS es solo una señal más entre muchas.",
        ],
      },
      {
        title: "Por qué importa para tu negocio",
        blocks: [
          [
            "Chrome, Safari y Firefox marcan como «No segura» cualquier página sin HTTPS, y muestran advertencias aún más visibles si tiene formularios.",
            "Google usa HTTPS como una de sus señales de experiencia de página.",
            "Funciones modernas del navegador, como la geolocalización o ciertos medios de pago, solo están disponibles en páginas seguras.",
            "Si vendes online o recoges datos personales, cifrar la conexión forma parte de proteger esos datos como exige la normativa.",
          ],
        ],
      },
      {
        title: "Cómo activarlo gratis",
        blocks: [
          "La mayoría de alojamientos ofrecen certificados gratuitos de Let's Encrypt desde su panel de control: busca «SSL», «Certificados» o «Let's Encrypt», elige tu dominio y actívalo. Las plataformas como Shopify, Wix, Squarespace o Vercel lo activan solas al conectar el dominio. Estos certificados duran poco tiempo y se renuevan automáticamente, así que no tienes que acordarte de nada mientras la renovación automática esté activa.",
          "Si tu alojamiento te cobra por un certificado básico, compara: hoy no hay motivo técnico para pagar por el cifrado de una web normal.",
        ],
      },
      {
        title: "Después de activarlo: tres comprobaciones",
        blocks: [
          [
            "Redirección: escribe tu dominio con http:// y comprueba que te lleva a https://. Si no, activa la redirección en el panel del alojamiento o en la configuración del servidor. Así Google y tus visitantes llegan siempre a la versión segura.",
            "Contenido mixto: si la página segura carga imágenes o scripts con direcciones http://, el navegador puede bloquearlos o quitar el candado. Cambia esos enlaces a https:// (en WordPress, actualizando la dirección del sitio y la base de datos).",
            "HSTS: es una cabecera que indica al navegador que use siempre HTTPS con tu dominio. Actívala cuando tengas claro que todo funciona por HTTPS, porque es difícil de deshacer a corto plazo.",
          ],
          "El inspector de Pikolete revisa el certificado, la redirección y las cabeceras de seguridad, y te dice qué falta.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Un certificado SSL gratuito es peor que uno de pago?",
        a: "Para cifrar la conexión, no: el cifrado es el mismo. Los certificados de pago pueden incluir validación de la empresa o seguros, útiles en casos concretos, pero no aportan más seguridad a la conexión de una web normal.",
      },
      {
        q: "¿Qué pasa si caduca el certificado?",
        a: "Los navegadores muestran una pantalla de error a pantalla completa y la mayoría de visitantes no pasará de ahí. Asegúrate de que la renovación automática está activa y de que te llegan los avisos del alojamiento.",
      },
      {
        q: "¿El candado significa que la web es de fiar?",
        a: "No. Solo garantiza que la conexión va cifrada. Para saber si una tienda es fiable hay que mirar otras cosas, como quién está detrás, la antigüedad del dominio o las condiciones de devolución.",
      },
    ],
  },
]
