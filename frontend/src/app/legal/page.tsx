import React from 'react';

type LegalPageProps = {
  kind: 'privacy' | 'terms' | 'refunds';
};

const privacySections = [
  {
    title: '1. Responsable y alcance',
    paragraphs: [
      'Esta Política de privacidad aplica a Lacasaca Cartagena y al uso de su catálogo, carrito, checkout, cuenta de usuario y seguimiento de pedidos. Lacasaca Cartagena es una tienda virtual de camisetas de fútbol con operación y domicilios en la ciudad de Cartagena.',
      'La política explica qué información necesitamos para prestar el servicio, para qué la usamos y cuáles son las opciones de las personas que visitan o compran en la tienda.',
    ],
  },
  {
    title: '2. Información que recopilamos',
    paragraphs: [
      'Podemos recibir los datos que una persona entrega al crear una cuenta, iniciar sesión o completar una compra, como nombre, correo electrónico, teléfono, dirección y datos necesarios para la entrega. La compra como invitado es posible, pero las funciones de cuenta, historial y cancelación asociada a usuario requieren autenticación.',
      'También registramos la información de la operación: productos y variantes seleccionadas, talla, versión, jugador u otros atributos configurados, cantidades, precios unitarios, descuentos o envío aplicables, identificador del pedido, estado del pedido y estado del pago.',
      'Para proteger la operación podemos conservar datos técnicos de sesión, preferencias del carrito y registros de acciones administrativas. Las contraseñas no se almacenan en texto plano: se procesan mediante un mecanismo seguro de hash.',
    ],
  },
  {
    title: '3. Para qué usamos la información',
    paragraphs: [
      'Usamos la información para mostrar productos activos, buscar y filtrar el catálogo, mantener el carrito, validar variantes, precios y cantidades, calcular el total desde el servidor, confirmar pedidos y coordinar su entrega.',
      'La usamos asimismo para autenticar usuarios, mostrar a cada usuario únicamente sus propios pedidos, gestionar solicitudes de cancelación permitidas y atender consultas relacionadas con la compra.',
      'El inventario se descuenta de forma consistente al crear el pedido. Si un pago manual falla o expira, se reintegra el inventario reservado conforme a las reglas del servicio. Estos registros ayudan a evitar sobreventas y a mantener el historial comercial del pedido.',
    ],
  },
  {
    title: '4. Pagos y comunicaciones',
    paragraphs: [
      'Los únicos métodos habilitados son contraentrega y transferencia vía WhatsApp. Lacasaca Cartagena no integra una pasarela de pagos en este servicio ni marca un pedido como pagado sin una confirmación válida.',
      'Cuando se usa transferencia vía WhatsApp, la referencia y el resultado de la confirmación se asocian al pedido. Solo administradores autorizados pueden confirmar manualmente una transferencia y una misma confirmación no debe procesarse más de una vez.',
      'Podemos usar el teléfono y los datos de entrega para coordinar el domicilio o comunicarnos sobre el pedido. No vendemos los datos personales ni los usamos para fines ajenos a la operación y atención de la tienda.',
    ],
  },
  {
    title: '5. Acceso, seguridad y conservación',
    paragraphs: [
      'El acceso administrativo está separado de la autenticación normal y se limita a personas con permisos suficientes. Las acciones administrativas relevantes pueden quedar registradas para auditoría, incluyendo el administrador, la acción, la entidad afectada y sus metadatos.',
      'Aplicamos medidas razonables para proteger cuentas, pedidos y datos de operación. Ningún medio de transmisión o almacenamiento puede garantizar seguridad absoluta, por lo que también pedimos a cada usuario proteger sus credenciales y avisarnos si detecta un uso no autorizado.',
      'Conservamos la información mientras sea necesaria para prestar el servicio, atender reclamos, mantener el historial de pedidos y cumplir obligaciones aplicables. Cuando ya no sea necesaria, se eliminará o anonimizará según corresponda.',
    ],
  },
  {
    title: '6. Derechos y contacto',
    paragraphs: [
      'Puedes solicitar acceso, corrección o actualización de tus datos, preguntar cómo se usan, pedir la eliminación cuando sea procedente o retirar autorizaciones que no sean indispensables para ejecutar una compra. Algunas solicitudes pueden requerir verificar la identidad y no podrán afectar obligaciones de conservación aplicables.',
      'Para ejercer estos derechos o resolver una inquietud sobre privacidad, contáctanos por WhatsApp en el canal oficial de la tienda o por los medios de contacto publicados en Lacasaca Cartagena. Responderemos dentro de un plazo razonable y explicaremos cualquier limitación.',
    ],
  },
];

const termsSections = [
  {
    title: '1. Aceptación y servicio',
    paragraphs: [
      'Estos Términos del servicio regulan el uso de la tienda virtual Lacasaca Cartagena. Al navegar, crear una cuenta o realizar una compra, aceptas estas reglas. Si no estás de acuerdo, no debes usar el checkout ni proporcionar datos para crear un pedido.',
      'El catálogo está destinado exclusivamente a camisetas de fútbol. Los productos y variantes pueden ser de entrega inmediata o bajo pedido, según la disponibilidad mostrada en cada ficha.',
    ],
  },
  {
    title: '2. Catálogo, variantes y precios',
    paragraphs: [
      'Cada producto puede tener variantes con identificador, talla, versión, manga larga, torneo, jugador u otros atributos. Las variantes agotadas o desactivadas no pueden agregarse a una nueva compra.',
      'El precio, los descuentos, el envío y cualquier otro concepto aplicable se recalculan en el servidor al confirmar el checkout. El cliente no puede proporcionar ni modificar el total final. El pedido conserva el precio, la variante y la cantidad usados en la compra, aunque el catálogo cambie después.',
    ],
  },
  {
    title: '3. Carrito, compra y disponibilidad',
    paragraphs: [
      'Agregar una camiseta al carrito no reserva inventario. Antes de crear el pedido se vuelven a validar la actividad del producto y la variante, las cantidades, el precio vigente y el stock real. Las cantidades deben ser enteros mayores que cero y no superar el inventario disponible.',
      'La compra como invitado está permitida. Una cuenta registrada es necesaria para consultar el historial propio y usar las funciones exclusivas de cuenta. Cada correo registrado debe ser único y las credenciales deben manejarse de forma segura.',
      'Si varias personas intentan comprar la última unidad, solo puede confirmarse una operación válida. El stock nunca debe quedar negativo; una operación que no pueda validarse será rechazada con un mensaje comprensible.',
    ],
  },
  {
    title: '4. Pagos, entrega y pedidos',
    paragraphs: [
      'Los métodos disponibles son contraentrega y transferencia vía WhatsApp. La contraentrega requiere un número de teléfono y solo está disponible para productos de entrega inmediata. No se integra una pasarela de pagos.',
      'Un pedido no se considera pagado hasta recibir una confirmación válida. Los pedidos con pago manual pendiente descuentan el inventario al crearse; si el pago falla o expira después de 24 horas, el inventario reservado se reintegra conforme al estado de la operación.',
      'Los estados válidos son PENDIENTE, EN_PREPARACION, ENVIADO, ENTREGADO y CANCELADO. Solo administradores autorizados pueden avanzar el pedido entre estados operativos. El cliente puede solicitar cancelación únicamente en PENDIENTE o EN_PREPARACION; los pedidos ENVIADO, ENTREGADO o CANCELADO no pueden cancelarse mediante la operación normal.',
    ],
  },
  {
    title: '5. Política de uso de inteligencia artificial',
    paragraphs: [
      'Lacasaca Cartagena puede utilizar herramientas de inteligencia artificial como apoyo para organizar información del catálogo, mejorar textos, responder preguntas frecuentes o asistir tareas internas. La IA es una herramienta de apoyo y no reemplaza la revisión humana ni las decisiones del negocio.',
      'No debes enviar a una herramienta de IA contraseñas, datos de pago, documentos de identidad, información privada de terceros ni información que no sea necesaria para recibir ayuda. Las respuestas generadas por IA pueden ser incompletas o equivocadas: antes de comprar, pagar, configurar una camiseta o tomar una decisión importante, verifica la información con la tienda.',
      'La IA no confirma pagos, no autoriza administradores, no cambia precios históricos, no modifica inventario por sí sola y no decide la aprobación o cancelación de un pedido. Esas acciones deben seguir las validaciones del servicio y, cuando corresponda, la revisión de un administrador autorizado.',
      'Está prohibido usar funciones asistidas por IA para suplantar personas, generar fraude, intentar acceder a cuentas o pedidos ajenos, evadir controles, extraer datos de otros usuarios o producir contenido ilegal, abusivo o que infrinja derechos de terceros. Podemos limitar el acceso y revisar incidentes para proteger a la comunidad.',
    ],
  },
  {
    title: '6. Uso aceptable y cambios',
    paragraphs: [
      'Debes proporcionar información veraz, proteger tus credenciales y usar la tienda de forma lícita. No puedes manipular el checkout, intentar vender sin stock, acceder a datos de otras cuentas, interferir con el servicio ni usar automatizaciones que perjudiquen su funcionamiento.',
      'Podemos actualizar estos Términos o la Política de privacidad para reflejar cambios del servicio, de la operación o de la normativa. Publicaremos la versión vigente en esta página e indicaremos la fecha de actualización. El uso posterior a un cambio implica la aceptación de la nueva versión.',
    ],
  },
];

const refundsSections = [
  {
    title: '1. Alcance de la política',
    paragraphs: [
      'Esta Política de reembolsos aplica a las compras realizadas en Lacasaca Cartagena y explica cuándo procede una cancelación, devolución o reintegro de dinero. Las solicitudes se revisan según el estado del pedido, el método de pago y la disponibilidad del producto.',
      'El reembolso no cambia los precios históricos, las cantidades ni las variantes registradas en el pedido. Cuando corresponda, también se actualiza el estado del pago y se reintegra el inventario reservado.',
    ],
  },
  {
    title: '2. Cancelaciones antes del envío',
    paragraphs: [
      'Un pedido puede solicitarse para cancelación únicamente mientras se encuentre en estado PENDIENTE o EN_PREPARACION. La solicitud debe realizarla el usuario autenticado asociado al pedido o comunicarse por el canal oficial de la tienda cuando se trate de una compra como invitado.',
      'Los pedidos en estado ENVIADO o ENTREGADO no pueden cancelarse mediante la operación normal. Un pedido ya CANCELADO no puede reabrirse ni procesarse nuevamente como una venta activa.',
      'Si la cancelación es aprobada, se reintegra el inventario cuando corresponda y se procesa el reembolso del pago recibido conforme al método utilizado. Una solicitud no se considera aprobada hasta que Lacasaca Cartagena la confirme.',
    ],
  },
  {
    title: '3. Productos defectuosos o diferentes',
    paragraphs: [
      'Si recibes una camiseta con un defecto de fabricación, una talla o variante diferente a la confirmada, o un producto que no corresponde al pedido, debes reportarlo por WhatsApp tan pronto como sea posible después de la entrega, indicando el identificador del pedido y adjuntando fotografías claras del producto y del empaque.',
      'Evaluaremos el caso y podremos ofrecer, según la situación y la disponibilidad, cambio por una unidad correcta, reparación, crédito en tienda o reembolso. No debes usar, lavar, modificar ni retirar las etiquetas del producto mientras se revisa el reclamo, salvo que el defecto solo pueda evidenciarse durante el uso normal.',
      'Los productos enviados correctamente no se consideran defectuosos por diferencias menores propias de fotografías, iluminación o fabricación, siempre que conserven las características esenciales anunciadas.',
    ],
  },
  {
    title: '4. Productos bajo pedido y excepciones',
    paragraphs: [
      'Las camisetas configuradas o fabricadas bajo pedido pueden tener restricciones de cancelación una vez iniciado el proceso de preparación, porque se elaboran con atributos específicos como talla, versión, manga larga, torneo o dorsal. Antes de iniciar ese proceso confirmaremos, cuando sea necesario, los detalles de la solicitud.',
      'No procede un reembolso por cambio de opinión, selección incorrecta de talla o atributos personalizados cuando el producto fue elaborado correctamente conforme a la confirmación del cliente. Esto no limita los derechos que correspondan si existe un defecto, incumplimiento o producto diferente al comprado.',
    ],
  },
  {
    title: '5. Pagos manuales y tiempos',
    paragraphs: [
      'En contraentrega no se realiza un reembolso anticipado porque el pago se efectúa al recibir el pedido. Si el pedido se cancela antes de la entrega, no se genera cobro; si ya se realizó un pago y existe un saldo a favor, se coordinará su devolución.',
      'En transferencias vía WhatsApp, el pedido no se marca como pagado hasta que un administrador autorizado confirme la transferencia. Si el pago manual falla o expira después de 24 horas, el inventario reservado se reintegra y cualquier devolución aplicable se coordina una vez validada la transacción.',
      'Una vez aprobado, el reembolso se gestiona por el mismo medio de pago cuando sea posible. Los tiempos efectivos dependen de la validación del caso y de la entidad financiera o canal utilizado; te informaremos si necesitamos datos adicionales.',
    ],
  },
  {
    title: '6. Cómo solicitar un reembolso',
    paragraphs: [
      'Escríbenos por el WhatsApp oficial de Lacasaca Cartagena con tu nombre, número de pedido, motivo de la solicitud, fotografías o soportes relevantes y el método de pago utilizado. No envíes contraseñas ni datos completos de tarjetas.',
      'Responderemos con la decisión, las instrucciones para devolver el producto si aplica y cualquier información necesaria para completar el proceso. Podemos solicitar evidencia adicional para evitar errores o fraudes y para verificar que la solicitud proviene de la persona compradora.',
    ],
  },
];

export function LegalPage({ kind }: LegalPageProps) {
  const isPrivacy = kind === 'privacy';
  const isRefunds = kind === 'refunds';
  const sections = isPrivacy ? privacySections : isRefunds ? refundsSections : termsSections;

  return (
    <article className="legal-page">
      <header className="legal-hero">
        <p className="home-kicker">Lacasaca Cartagena</p>
        <h1>{isPrivacy ? 'Política de privacidad' : isRefunds ? 'Política de reembolsos' : 'Términos del servicio'}</h1>
        <p>
          {isPrivacy
            ? 'Información clara sobre los datos que usamos para que puedas comprar camisetas de fútbol de forma segura.'
            : isRefunds
              ? 'Conoce cuándo puedes solicitar una cancelación, devolución o reembolso de tu compra.'
              : 'Las reglas para navegar, comprar, pagar y usar responsablemente nuestra tienda virtual.'}
        </p>
        <small>Última actualización: 23 de octubre de 2026</small>
      </header>
      <div className="legal-content">
        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
      </div>
    </article>
  );
}
