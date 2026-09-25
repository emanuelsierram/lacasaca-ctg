import React, { useEffect, useState } from "react";
import { api, type Product } from "../../api";
import { immediatePrice, madeToOrderPrice } from "../../pricing";
import { formatCOP } from "../../currency";

const sizes = ["S", "M", "L", "XL", "XXL"];
const versions = ["Fan", "Player"];
const tournaments = [
  "Liga",
  "Copa",
  "Champions League",
  "Copa Libertadores",
  "Mundial",
];
type MadeToOrderAttributes = {
  size: string;
  version: string;
  longSleeves: boolean;
  tournament: string;
  dorsal: string;
};
const emptyMadeToOrder: MadeToOrderAttributes = {
  size: "",
  version: "Fan",
  longSleeves: false,
  tournament: "",
  dorsal: "",
};

export function ProductDetailPage({
  productId,
  onCartChange,
  onCheckout,
  onBack,
}: {
  productId: string;
  onCartChange: () => Promise<void>;
  onCheckout: () => void;
  onBack: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedDorsal, setSelectedDorsal] = useState("");
  const [attributes, setAttributes] =
    useState<MadeToOrderAttributes>(emptyMadeToOrder);
  const [selectedImage, setSelectedImage] = useState(0);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api
      .getProduct(productId)
      .then((next) => {
        setProduct(next);
        setSelectedVariantId(
          next.variants.find((variant) => variant.isActive)?.id ?? "",
        );
        const firstVariant = next.variants.find((variant) => variant.isActive);
        setSelectedSize(String(firstVariant?.attributes.size ?? ""));
        setSelectedDorsal(String(firstVariant?.attributes.dorsal ?? ""));
        setSelectedImage(0);
        setAttributes(emptyMadeToOrder);
      })
      .catch((reason: Error) => setMessage(reason.message));
  }, [productId]);
  if (!product)
    return (
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        {message || "Cargando producto..."}
      </section>
    );
  const variants = product.variants.filter((variant) => variant.isActive);
  const isMadeToOrder = product.availabilityType === "MADE_TO_ORDER";
  const hidesVersion = ["RETROS", "NINOS", "FEMENINO"].includes(product.category);
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
  const selectedVariant = isMadeToOrder
    ? variants.find((variant) => variant.id === selectedVariantId)
    : sizeVariants.find(
        (variant) =>
          String(variant.attributes.dorsal ?? "").trim() === selectedDorsal,
      ) ??
      noDorsalVariant;
  const baseVariant = variants[0] ?? selectedVariant;
  const available = isMadeToOrder
    ? Boolean(attributes.size)
    : Boolean(selectedVariant && selectedVariant.stock > 0);
  const price =
    isMadeToOrder && baseVariant
      ? madeToOrderPrice(baseVariant.price, attributes)
      : selectedVariant
        ? immediatePrice(selectedVariant.price, selectedDorsal)
        : 0;
  const images = product.images ?? [];
  const currentImage = images[selectedImage];
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
    const customAttributes = isMadeToOrder
      ? {
          size: attributes.size,
          version: attributes.version,
          "long-sleeves": attributes.longSleeves,
          tournament: attributes.tournament,
          dorsal: attributes.dorsal,
        }
      : { ...selectedVariant.attributes, dorsal: selectedDorsal };
    api
      .addToCart(variant.id, 1, customAttributes)
      .then(async () => {
        await onCartChange();
        if (goToCheckout) {
          onCheckout();
          return;
        }
        setMessage("Producto agregado al carrito.");
      })
      .catch((reason: Error) => setMessage(reason.message));
  };
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <button
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-slate-600"
      >
        ← Volver al catálogo
      </button>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
          <div>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
              {currentImage && (
                <img
                  src={currentImage}
                  alt={`${product.name} vista ${selectedImage + 1}`}
                  className="block h-full w-full object-contain"
                />
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                    className="absolute left-3 rounded-full bg-white px-3 py-2 text-lg shadow"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                    className="absolute right-3 rounded-full bg-white px-3 py-2 text-lg shadow"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Ver imagen ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 p-1 ${selectedImage === index ? "border-slate-900" : "border-transparent"}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-3">
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
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-3 text-slate-600">{product.description}</p>
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
                  Versión
                  <select
                    value={attributes.version}
                    onChange={(event) => update("version", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Selecciona</option>
                    {versions.map((version) => (
                      <option key={version}>{version}</option>
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
                        setSelectedVariantId(nextVariant?.id ?? "");
                      }}
                      className={`rounded-xl border px-4 py-2 ${selectedSize === size ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {dorsalOptions.length > 0 && (
                  <>
                    <p className="mt-5 text-sm font-medium">Dorsal</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {noDorsalVariant && (
                        <button
                          type="button"
                          onClick={() => setSelectedDorsal("")}
                          className={`rounded-xl border px-4 py-2 ${!selectedDorsal ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                        >
                          Sin dorsal
                        </button>
                      )}
                      {dorsalOptions.map((dorsal) => (
                        <button
                          key={dorsal}
                          type="button"
                          onClick={() => setSelectedDorsal(dorsal)}
                          className={`rounded-xl border px-4 py-2 ${selectedDorsal === dorsal ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"}`}
                        >
                          {dorsal}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-5 grid gap-2 text-sm text-slate-600">
                  {!hidesVersion && selectedVariant?.attributes.version && (
                    <p>Versión: {String(selectedVariant.attributes.version)}</p>
                  )}
                  {selectedVariant?.attributes.tournament && (
                    <p>Torneo: {String(selectedVariant.attributes.tournament)}</p>
                  )}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5">
              <div>
                <p className="text-sm text-slate-500">Precio</p>
                <p className="text-3xl font-bold">{formatCOP(price)}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:max-w-md">
                <button
                  type="button"
                  disabled={!available}
                  onClick={() => addToCart()}
                  className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {available ? "Agregar al carrito" : "Selecciona una talla"}
                </button>
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
    </section>
  );
}
