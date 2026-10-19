import React from 'react';

export function AboutPage({ onOpenCatalog }: { onOpenCatalog: () => void }) {
  return (
    <section className="about-page">
      <div className="about-content">
        <p className="home-kicker">Sobre nosotros</p>
        <h1>La pasión por el fútbol se viste en Cartagena</h1>
        <p>Somos una tienda virtual especializada en camisetas de fútbol para quienes viven y sienten este deporte. Seleccionamos cada diseño pensando en los hinchas que buscan calidad, comodidad y una prenda que represente sus colores con orgullo.</p>
        <p>Trabajamos con camisetas importadas en calidad 1.1, ideales para quienes buscan una versión tipo jugador con acabados y detalles de alto nivel, y con camisetas triple AAA en versión fan, una alternativa cómoda y accesible para alentar a tu equipo en cualquier ocasión.</p>
        <p>Realizamos domicilios gratis en la ciudad de Cartagena y te acompañamos durante todo el proceso de compra. Puedes elegir entre referencias disponibles para entrega inmediata o solicitar tu diseño favorito bajo pedido. Queremos que encuentres la camiseta perfecta y la recibas de forma fácil, segura y confiable.</p>
        <button type="button" className="about-action" onClick={onOpenCatalog}>Conoce nuestra colección <span aria-hidden="true">↗</span></button>
      </div>
      <div className="about-highlights" aria-label="Beneficios de Lacasaca Cartagena">
        <div><strong>1.1</strong><span>Calidad tipo jugador</span></div>
        <div><strong>Triple AAA</strong><span>Versión fan para todos</span></div>
        <div><strong>Gratis</strong><span>Domicilio en Cartagena</span></div>
      </div>
    </section>
  );
}
