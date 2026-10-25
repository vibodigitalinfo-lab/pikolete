/** Guía de 5 pasos para comprobar una tienda online. Contenido útil para el lector y para Google. */
export function TrustGuide({ title = "Cómo saber si una tienda online es fiable en 5 pasos" }: { title?: string }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 pb-16">
      <h2 className="text-3xl font-extrabold tracking-tight text-primary">{title}</h2>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-muted-foreground">
        <li>
          <strong className="text-foreground">Mira la dirección con lupa.</strong> Las copias usan nombres parecidos a
          marcas conocidas, con guiones o palabras como «outlet» u «ofertas».
        </li>
        <li>
          <strong className="text-foreground">Busca el aviso legal.</strong> Debe aparecer el nombre de la empresa, su
          CIF y una dirección física. Copia el CIF en Google: si no sale ninguna empresa, mala señal.
        </li>
        <li>
          <strong className="text-foreground">Desconfía de los chollos.</strong> Nadie vende zapatillas de marca al 80 %
          de descuento todo el año.
        </li>
        <li>
          <strong className="text-foreground">Lee opiniones fuera de la web.</strong> Busca «nombre de la tienda +
          opiniones» o «+ estafa». Las reseñas de la propia web no cuentan.
        </li>
        <li>
          <strong className="text-foreground">Paga con protección.</strong> Tarjeta o PayPal te permiten reclamar el
          dinero. Nunca pagues por transferencia a una tienda que no conoces.
        </li>
      </ol>
    </section>
  )
}
