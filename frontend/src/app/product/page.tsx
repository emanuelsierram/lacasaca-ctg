import React, { useEffect, useState } from "react";
import { api, type Product } from "../../api";
import { madeToOrderPrice } from "../../pricing";
import { formatCOP } from "../../currency";
import { ConfirmDialog } from "../../components/confirm-dialog";

const sizes = ["S", "M", "L", "XL", "XXL"];
const tournaments = [
  "Liga",
  "Copa",
  "Champions League",
  "Copa Libertadores",
  "Mundial",
];
const sizeGuides = [
  { label: "", image: "/size-guide-men.svg" },
  { label: "", image: "/size-guide-women.svg" },
  { label: "", image: "/size-guide-kids.svg" },
];
type MadeToOrderAttributes = {
  size: string;
  longSleeves: boolean;
  tournament: string;
  dorsal: string;
};
const emptyMadeToOrder: MadeToOrderAttributes = {
  size: "",
  longSleeves: false,
  tournament: "",
  dorsal: "",
};

export function ProductDetailPage({
  productId,
  onCartChange,
  onCartAdded,
  onCheckout,
  onBack,
}: {
  productId: string;
  onCartChange: () => Promise<void>;
  onCartAdded: () => void;
  onCheckout: () => void;
  onBack: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDorsal, setSelectedDorsal] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("");
  const [attributes, setAttributes] =
    useState<MadeToOrderAttributes>(emptyMadeToOrder);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const images = product?.images ?? [];
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setMessage("");
    setProduct(null);
    api
      .getProduct(productId)
      .then((next) => {
        if (!active) return;
        setProduct(next);
        const firstVariant = next.variants
          .filter((variant) => variant.isActive)
          .reduce(
            (lowest, variant) =>
              !lowest || variant.price < lowest.price ? variant : lowest,
            next.variants.find((variant) => variant.isActive),
          );
        setSelectedVariantId(firstVariant?.id ?? "");
        setSelectedSize(String(firstVariant?.attributes.size ?? ""));
        setSelectedDorsal(String(firstVariant?.attributes.dorsal ?? ""));
        setSelectedTournament(String(firstVariant?.attributes.tournament ?? ""));
        setSelectedImage(0);
        setAttributes(emptyMadeToOrder);
      })
      .catch((reason: Error) => {
        if (active) setMessage(reason.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productId]);
  useEffect(() => {
    if (!isImageViewerOpen && !isSizeGuideOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageViewerOpen(false);
        setIsSizeGuideOpen(false);
      }
      if (event.key === "ArrowLeft" && images.length > 1) {
        setSelectedImage((current) => (current - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        setSelectedImage((current) => (current + 1) % images.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageViewerOpen, isSizeGuideOpen, images.length]);
  if (isLoading)
    return (
      <section
        className="mx-auto flex min-h-64 max-w-3xl flex-col items-center justify-center gap-3 px-6 py-12 text-center text-slate-600"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-600"
          aria-hidden="true"
        />
        <span>Cargando producto...</span>
      </section>
    );
  if (!product)
    return (
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        {message || "Cargando producto..."}
      </section>
    );
  const variants = product.variants.filter((variant) => variant.isActive);
  const isMadeToOrder = product.availabilityType === "MADE_TO_ORDER";
  const availableSizes = [
    ...new Set(
      variants.map((variant) => String(variant.attributes.size ?? "Única")),
    ),
  ].sort((left, right) => {
    const leftIndex = sizes.indexOf(left);
    const rightIndex = sizes.indexOf(right);
    return (leftIndex === -1 ? sizes.length : leftIndex) -
      (rightIndex === -1 ? sizes.length : rightIndex);
  });
  const sizeVariants = variants.filter(
    (variant) => String(variant.attributes.size ?? "") === selectedSize,
  );
  const dorsalOptions = [
    ...new Set(
      sizeVariants
        .map((variant) => String(variant.attributes.dorsal ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const noDorsalVariant = sizeVariants.find(
    (variant) => !String(variant.attributes.dorsal ?? "").trim(),
  );
  const tournamentOptions = [
    ...new Set(
      sizeVariants.map((variant) =>
        String(variant.attributes.tournament ?? "").trim(),
      ),
    ),
  ];
  const hasTournamentOption = tournamentOptions.some(Boolean);
  const selectedVariant = isMadeToOrder
    ? variants.find((variant) => variant.id === selectedVariantId)
    : sizeVariants.find(
        (variant) =>
          String(variant.attributes.dorsal ?? "").trim() === selectedDorsal &&
          String(variant.attributes.tournament ?? "").trim() === selectedTournament,
      ) ??
      sizeVariants.find(
        (variant) =>
          String(variant.attributes.dorsal ?? "").trim() === selectedDorsal,
      ) ??
      noDorsalVariant;
  const available = isMadeToOrder
    ? Boolean(attributes.size)
    : Boolean(selectedVariant && selectedVariant.stock > 0);
  const baseVariant = selectedVariant ?? variants[0];
  const price =
    isMadeToOrder && baseVariant
      ? madeToOrderPrice(baseVariant.price, attributes)
      : selectedVariant?.price ?? 0;
  const currentImage = images[selectedImage];
  const openImageViewer = () => {
    if (currentImage) setIsImageViewerOpen(true);
  };
  const update = (
    field: keyof MadeToOrderAttributes,
    value: string | boolean,
  ) => setAttributes((current) => ({ ...current, [field]: value }));
  const addToCart = (goToCheckout = false) => {
    const variant = isMadeToOrder ? baseVariant : selectedVariant;
    if (!variant || !available) {
      setMessage("Selecciona una talla para continuar.");
      return;
    }
    const customAttributes: Record<string, string | boolean> = isMadeToOrder
      ? {
          size: attributes.size,
          "long-sleeves": attributes.longSleeves,
          tournament: attributes.tournament,
          dorsal: attributes.dorsal,
        }
      : Object.fromEntries(
          Object.entries({
            ...variant.attributes,
            dorsal: selectedDorsal,
          }).filter(([, value]) => value !== undefined),
        ) as Record<string, string | boolean>;
    api
      .addToCart(variant.id, 1, customAttributes)
      .then(async () => {
        await onCartChange();
        if (goToCheckout) {
          onCheckout();
          return;
        }
        onCartAdded();
        setMessage("Producto agregado al carrito.");
      })
      .catch((reason: Error) => setErrorMessage(reason.message));
  };
  return (
    <section className="mx-auto max-w-6xl px-0 py-6 pb-0 sm:px-6 sm:py-10 md:pb-10">
      <button
        onClick={onBack}
        className="mb-4 px-4 text-sm font-semibold text-slate-600 sm:px-0"
      >
        ← Volver al catálogo
      </button>
      <div className="overflow-hidden border-y border-slate-200 bg-white shadow-sm sm:rounded-3xl sm:border">
        <div className="grid gap-0 md:grid-cols-2 md:gap-8 md:p-8">
          <div className="min-w-0">
            <div
              className="relative mb-[-2.5rem] flex aspect-square w-full items-center justify-center overflow-hidden bg-white md:mb-0 md:rounded-2xl md:bg-slate-50"
              role={currentImage ? "button" : undefined}
              tabIndex={currentImage ? 0 : undefined}
              aria-label={currentImage ? "Ampliar imagen del producto" : undefined}
              onClick={openImageViewer}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openImageViewer();
                }
              }}
            >
              {currentImage && (
                <img
                  src={currentImage}
                  alt={`${product.name} vista ${selectedImage + 1}`}
                  className="product-mobile-image block h-full w-full cursor-zoom-in object-contain md:mask-none"
                />
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedImage((selectedImage - 1 + images.length) % images.length);
                    }}
                    className="absolute left-3 rounded-full bg-white px-3 py-2 text-lg shadow"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedImage((selectedImage + 1) % images.length);
                    }}
                    className="absolute right-3 rounded-full bg-white px-3 py-2 text-lg shadow"
                  >
                    ›
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={!available}
                onClick={(event) => {
                  event.stopPropagation();
                  addToCart();
                }}
                aria-label="Agregar al carrito"
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-900 shadow-lg disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h2l2.2 11h10.4L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="17" cy="19" r="1" />
                </svg>
              </button>
            </div>
            {images.length > 1 && (
              <div className="mt-3 hidden grid-cols-4 gap-2 md:grid md:flex md:overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Ver imagen ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 w-full shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 p-1 sm:w-16 ${selectedImage === index ? "border-slate-900" : "border-transparent"}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative z-10 flex min-w-0 flex-col justify-center rounded-t-3xl bg-white px-6 pb-5 pt-4 md:mt-0 md:rounded-none md:bg-transparent md:px-0 md:py-0">
            <div className="mb-4 hidden items-center gap-3 md:flex">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-800">
                {product.category}
              </span>
              {!isMadeToOrder && (
                <span
                  className={`text-sm font-semibold ${available ? "text-emerald-600" : "text-red-600"}`}
                >
                  {available ? "Disponible" : "Agotada"}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold md:text-3xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3 md:hidden">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-800">
                {product.category}
              </span>
              {!isMadeToOrder && (
                <span
                  className={`text-sm font-semibold ${available ? "text-emerald-600" : "text-red-600"}`}
                >
                  {available ? "Disponible" : "Agotada"}
                </span>
              )}
            </div>
            <div className="mt-2 md:hidden">
              <p className="text-4xl font-bold">{formatCOP(price)}</p>
            </div>
            <p className="mt-3 hidden text-slate-600 md:block">
              {product.description}
            </p>
            {isMadeToOrder ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Talla (obligatoria)
                  <select
                    required
                    value={attributes.size}
                    onChange={(event) => update("size", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Selecciona</option>
                    {sizes.map((size) => (
                      <option key={size}>{size}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Manga larga
                  <select
                    value={attributes.longSleeves ? "true" : "false"}
                    onChange={(event) =>
                      update("longSleeves", event.target.value === "true")
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Torneo
                  <select
                    value={attributes.tournament}
                    onChange={(event) =>
                      update("tournament", event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Ninguno</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament} value={tournament}>
                        {tournament}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Dorsal
                  <input
                    value={attributes.dorsal}
                    onChange={(event) => update("dorsal", event.target.value)}
                    placeholder="Opcional"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm font-medium">Talla</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        const nextVariants = variants.filter(
                          (variant) => String(variant.attributes.size ?? "") === size,
                        );
                        const nextVariant =
                          nextVariants.find(
                            (variant) => !String(variant.attributes.dorsal ?? "").trim(),
                          ) ?? nextVariants[0];
                        setSelectedDorsal(String(nextVariant?.attributes.dorsal ?? ""));
                        setSelectedTournament(
                          String(nextVariant?.attributes.tournament ?? ""),
                        );
                        setSelectedVariantId(nextVariant?.id ?? "");
                      }}
                      className={`rounded-xl border px-4 py-2 ${selectedSize === size ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-amber-700"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7.5 16.5 20 20 16.5 7.5 4 4 7.5Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m8 8 2-2m0 6 2-2m0 6 2-2" strokeLinecap="round" />
                  </svg>
                  Guía de tallas
                </button>
                {dorsalOptions.length > 0 && (
                  <>
                    <p className="mt-5 text-sm font-medium">Dorsal</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {noDorsalVariant && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextVariant =
                              sizeVariants.find(
                              (variant) =>
                                !String(variant.attributes.dorsal ?? "").trim() &&
                                String(variant.attributes.tournament ?? "").trim() ===
                                  selectedTournament,
                              ) ?? noDorsalVariant;
                            setSelectedDorsal("");
                            setSelectedTournament(
                              String(nextVariant?.attributes.tournament ?? ""),
                            );
                            setSelectedVariantId(nextVariant?.id ?? "");
                          }}
                          className={`rounded-xl border px-4 py-2 ${!selectedDorsal ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                        >
                          Sin dorsal
                        </button>
                      )}
                      {dorsalOptions.map((dorsal) => (
                        <button
                          key={dorsal}
                          type="button"
                          onClick={() => {
                            const nextVariant =
                              sizeVariants.find(
                                (variant) =>
                                  String(variant.attributes.dorsal ?? "").trim() ===
                                    dorsal &&
                                  String(variant.attributes.tournament ?? "").trim() ===
                                    selectedTournament,
                              ) ??
                              sizeVariants.find(
                                (variant) =>
                                  String(variant.attributes.dorsal ?? "").trim() ===
                                  dorsal,
                              );
                            setSelectedDorsal(dorsal);
                            setSelectedTournament(
                              String(nextVariant?.attributes.tournament ?? ""),
                            );
                            setSelectedVariantId(nextVariant?.id ?? "");
                          }}
                          className={`rounded-xl border px-4 py-2 ${selectedDorsal === dorsal ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                        >
                          {dorsal}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {hasTournamentOption && (
                  <>
                    <p className="mt-5 text-sm font-medium">Torneo</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {tournamentOptions.map((tournament) => (
                        <button
                          key={tournament || "sin-torneo"}
                          type="button"
                          onClick={() => {
                            const nextVariant =
                              sizeVariants.find(
                                (variant) =>
                                  String(variant.attributes.dorsal ?? "").trim() ===
                                    selectedDorsal &&
                                  String(variant.attributes.tournament ?? "").trim() ===
                                    tournament,
                              ) ??
                              sizeVariants.find(
                                (variant) =>
                                  String(variant.attributes.tournament ?? "").trim() ===
                                  tournament,
                              );
                            setSelectedDorsal(
                              String(nextVariant?.attributes.dorsal ?? ""),
                            );
                            setSelectedTournament(tournament);
                            setSelectedVariantId(nextVariant?.id ?? "");
                          }}
                          className={`rounded-xl border px-4 py-2 ${selectedTournament === tournament ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                        >
                          {tournament || "Sin torneo"}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="mt-8 border-t border-slate-200 pt-4 md:hidden">
              <div className="rounded-xl bg-slate-100 px-4">
              <button
                type="button"
                aria-expanded={isDescriptionOpen}
                onClick={() => setIsDescriptionOpen((open) => !open)}
                className="flex w-full items-center justify-between py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-900">Descripción</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 text-slate-500 transition-transform ${isDescriptionOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isDescriptionOpen && (
                <p className="pb-5 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>
              )}
              </div>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-slate-200 bg-white px-3 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] md:static md:z-auto md:mt-6 md:flex-col md:border-t md:px-0 md:py-0 md:pt-5 md:shadow-none">
              <div className="hidden md:block">
                <p className="text-sm text-slate-500">Precio</p>
                <p className="mt-1 text-3xl font-bold">{formatCOP(price)}</p>
              </div>
              <div className="flex w-full md:max-w-md">
                <button
                  type="button"
                  disabled={!available}
                  onClick={() => addToCart(true)}
                  className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Comprar ahora
                </button>
              </div>
            </div>
            {message && (
              <p className="mt-3 text-sm text-slate-600">{message}</p>
            )}
          </div>
        </div>
      </div>
      {isImageViewerOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name}, imagen ${selectedImage + 1}`}
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            type="button"
            aria-label="Cerrar imagen ampliada"
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 px-4 py-2 text-2xl leading-none text-white hover:bg-white/20 sm:right-6 sm:top-6"
          >
            ×
          </button>
          <img
            src={currentImage}
            alt={`${product.name} vista ${selectedImage + 1}`}
            className="max-h-[calc(100vh-6rem)] max-w-full object-contain sm:max-h-[calc(100vh-7rem)]"
            onClick={(event) => event.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Imagen anterior"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImage((selectedImage - 1 + images.length) % images.length);
                }}
                className="absolute left-2 rounded-full bg-white/15 px-4 py-2 text-3xl text-white hover:bg-white/25 sm:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Imagen siguiente"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedImage((selectedImage + 1) % images.length);
                }}
                className="absolute right-2 rounded-full bg-white/15 px-4 py-2 text-3xl text-white hover:bg-white/25 sm:right-6"
              >
                ›
              </button>
              <p className="absolute bottom-3 left-0 right-0 text-center text-sm text-white/80 sm:bottom-6">
                {selectedImage + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-guide-title"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="size-guide-title" className="text-2xl font-bold text-slate-900">Guía de tallas</h2>
                <p className="mt-1 text-sm text-slate-500">Consulta la medida que corresponde a cada categoría.</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar guía de tallas"
                onClick={() => setIsSizeGuideOpen(false)}
                className="rounded-full px-3 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                ×
              </button>
            </div>
            <div className="grid gap-5">
              {sizeGuides.map((guide) => (
                <figure key={guide.label} className="mx-auto w-full max-w-4xl overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <figcaption className="border-b border-slate-200 bg-white px-4 py-3 text-center font-semibold text-slate-900">{guide.label}</figcaption>
                  <img src={guide.image} alt={`Guía de tallas para ${guide.label.toLowerCase()}`} className={`block h-auto ${guide.label === "Niños" ? "min-w-0 w-full max-w-none sm:min-w-[900px] sm:w-auto" : "w-full"}`} />
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <ConfirmDialog
          title="Stock insuficiente"
          message={errorMessage}
          confirmLabel="Entendido"
          showCancel={false}
          onConfirm={() => setErrorMessage("")}
          onCancel={() => setErrorMessage("")}
        />
      )}
    </section>
  );
}
