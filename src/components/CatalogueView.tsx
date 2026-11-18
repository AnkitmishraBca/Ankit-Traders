"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, DownloadIcon, ShareIcon } from "@/components/icons";
import { FieldLabel, Panel, SelectWrap } from "@/components/ui";
import {
  CATALOGUE_CATEGORIES,
  CATALOGUE_PAGES,
  CATALOGUE_PRODUCTS,
  compactSearch,
  normalizeSearch,
  type CataloguePage,
  type CatalogueProduct,
} from "@/lib/catalogue-data";

export function CatalogueBookIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11a2 2 0 0 1 2 2v15.5a1.5 1.5 0 0 0-1.5-1.5H3V5.5Z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13a2 2 0 0 0-2 2v15.5a1.5 1.5 0 0 1 1.5-1.5H21V5.5Z" />
    </svg>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

function ZoomInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8M11 8v6M8 11h6" />
    </svg>
  );
}

function ZoomOutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8M8 11h6" />
    </svg>
  );
}

const PRODUCTS_BY_PDF_PAGE = new Map<number, CatalogueProduct[]>();
for (const product of CATALOGUE_PRODUCTS) {
  const list = PRODUCTS_BY_PDF_PAGE.get(product.pdfPage) ?? [];
  list.push(product);
  PRODUCTS_BY_PDF_PAGE.set(product.pdfPage, list);
}

type SearchableProduct = {
  product: CatalogueProduct;
  haystack: string;
  compact: string;
  nameNorm: string;
  nameCompact: string;
};

const SEARCH_INDEX: SearchableProduct[] = CATALOGUE_PRODUCTS.map((product) => {
  const full = [
    product.name,
    product.form,
    product.categoryName,
    product.pack,
    product.mrp,
    product.uses,
    product.keywords,
    `page ${product.catPage}`,
  ].join(" ");
  return {
    product,
    haystack: normalizeSearch(full),
    compact: compactSearch(full),
    nameNorm: normalizeSearch(product.name),
    nameCompact: compactSearch(product.name),
  };
});

const ZOOM_STEPS = [1, 1.5, 2, 2.5];

export default function CatalogueView({
  onNotify,
}: {
  onNotify?: (message: string, tone?: "ok" | "error") => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [viewMode, setViewMode] = useState<"scroll" | "grid">("scroll");
  const [jumpValue, setJumpValue] = useState("");
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Full-screen lightbox viewer state
  const [activePdfPage, setActivePdfPage] = useState<number | null>(null);
  const [highlightProduct, setHighlightProduct] = useState<CatalogueProduct | null>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [sharing, setSharing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const viewerBodyRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const { matchedProducts, visiblePages } = useMemo(() => {
    const baseCategoryFilter = (pdfPage: number, itemCategoryId: string) =>
      categoryId === "all" ? true : itemCategoryId === categoryId && pdfPage >= 1;

    if (!isSearching) {
      const pages =
        categoryId === "all"
          ? CATALOGUE_PAGES
          : CATALOGUE_PAGES.filter((page) => page.categoryId === categoryId);
      return { matchedProducts: [] as CatalogueProduct[], visiblePages: pages };
    }

    const norm = normalizeSearch(trimmedQuery);
    const compact = compactSearch(trimmedQuery);
    const tokens = norm.split(" ").filter(Boolean);

    // Check explicit page search like "page 14" or "14"
    const pageMatch = /^(?:page|pg|p)?\s*(\d{1,2})$/i.exec(trimmedQuery);
    const requestedCatPage = pageMatch ? Number(pageMatch[1]) : null;

    const scored: { product: CatalogueProduct; score: number }[] = [];

    for (const entry of SEARCH_INDEX) {
      if (!baseCategoryFilter(entry.product.pdfPage, entry.product.categoryId)) continue;

      let matched = false;
      let score = 0;

      if (requestedCatPage !== null && entry.product.catPage === requestedCatPage) {
        matched = true;
        score += 50;
      }

      const allTokensHit =
        tokens.length > 0 &&
        tokens.every(
          (tok) => entry.haystack.includes(tok) || (tok.length >= 2 && entry.compact.includes(tok)),
        );

      const compactHit = compact.length >= 2 && entry.compact.includes(compact);

      if (allTokensHit || compactHit) {
        matched = true;
        if (entry.nameCompact.startsWith(compact)) score += 120;
        else if (entry.nameNorm.includes(norm) || entry.nameCompact.includes(compact)) score += 90;
        else if (tokens.every((tok) => entry.nameNorm.includes(tok))) score += 75;
        else score += 30;
      }

      if (matched) {
        scored.push({ product: entry.product, score });
      }
    }

    scored.sort(
      (a, b) => b.score - a.score || a.product.pdfPage - b.product.pdfPage,
    );

    const products = scored.map((entry) => entry.product);
    const matchedPageNums = new Set<number>(products.map((p) => p.pdfPage));

    if (requestedCatPage !== null) {
      const byCat = CATALOGUE_PAGES.find((p) => p.catPage === requestedCatPage);
      if (byCat && (categoryId === "all" || byCat.categoryId === categoryId)) {
        matchedPageNums.add(byCat.pdfPage);
      }
    }

    // Also match special pages (Cover, About, Index)
    for (const page of CATALOGUE_PAGES) {
      if (categoryId !== "all" && page.categoryId !== categoryId) continue;
      const pageHay = normalizeSearch(`${page.label} ${page.title} ${page.categoryName}`);
      if (tokens.length > 0 && tokens.every((tok) => pageHay.includes(tok))) {
        matchedPageNums.add(page.pdfPage);
      }
    }

    const pages = CATALOGUE_PAGES.filter((page) => matchedPageNums.has(page.pdfPage));
    return { matchedProducts: products, visiblePages: pages };
  }, [trimmedQuery, isSearching, categoryId]);

  const activePage: CataloguePage | null = useMemo(
    () =>
      activePdfPage === null
        ? null
        : (CATALOGUE_PAGES.find((page) => page.pdfPage === activePdfPage) ?? null),
    [activePdfPage],
  );

  const openViewer = (pdfPage: number, product: CatalogueProduct | null = null) => {
    setActivePdfPage(pdfPage);
    setHighlightProduct(product);
    setZoomIndex(0);
  };

  const closeViewer = () => {
    setActivePdfPage(null);
    setHighlightProduct(null);
    setZoomIndex(0);
  };

  const stepPage = (delta: number) => {
    setActivePdfPage((current) => {
      if (current === null) return null;
      const next = Math.min(CATALOGUE_PAGES.length, Math.max(1, current + delta));
      return next;
    });
    setHighlightProduct(null);
    setZoomIndex(0);
    if (viewerBodyRef.current) {
      viewerBodyRef.current.scrollTo({ top: 0, left: 0 });
    }
  };

  useEffect(() => {
    if (activePdfPage === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      else if (event.key === "ArrowRight") stepPage(1);
      else if (event.key === "ArrowLeft") stepPage(-1);
      else if (event.key === "+" || event.key === "=") {
        setZoomIndex((z) => Math.min(ZOOM_STEPS.length - 1, z + 1));
      } else if (event.key === "-") {
        setZoomIndex((z) => Math.max(0, z - 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activePdfPage]);

  const resetFilters = () => {
    setQuery("");
    setCategoryId("all");
    setJumpValue("");
    setShowAllMatches(false);
  };

  const handleJumpToPage = (value: string) => {
    setJumpValue(value);
    const pdfPage = Number(value);
    if (!pdfPage) return;

    // Clear search/category if target page is currently hidden
    const isVisible = visiblePages.some((p) => p.pdfPage === pdfPage);
    if (!isVisible) {
      setQuery("");
      setCategoryId("all");
    }

    window.setTimeout(() => {
      const element = document.getElementById(`catalogue-page-${pdfPage}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const handleShareOrDownloadPage = async (page: CataloguePage, mode: "share" | "download") => {
    setSharing(true);
    try {
      const fileName = page.catPage
        ? `SB-Herbals-Catalogue-Page-${String(page.catPage).padStart(2, "0")}.webp`
        : `SB-Herbals-Catalogue-${page.label.replace(/\s+/g, "-")}.webp`;

      if (mode === "share" && typeof navigator !== "undefined" && navigator.share) {
        const res = await fetch(page.image);
        const blob = await res.blob();
        const file = new File([blob], fileName, { type: blob.type || "image/webp" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Ankit Traders · ${page.title}`,
            text: highlightProduct
              ? `${highlightProduct.name} (${highlightProduct.pack} · MRP ${highlightProduct.mrp})`
              : `SB Herbals Catalogue — ${page.label}: ${page.title}`,
            files: [file],
          });
          return;
        }
      }

      const link = document.createElement("a");
      link.href = page.image;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      onNotify?.(`Catalogue ${page.label} downloaded`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      onNotify?.("Could not share page — downloading instead", "error");
    } finally {
      setSharing(false);
    }
  };

  const zoom = ZOOM_STEPS[zoomIndex];
  const displayedProducts = showAllMatches ? matchedProducts : matchedProducts.slice(0, 12);
  const activePageProducts = activePage ? (PRODUCTS_BY_PDF_PAGE.get(activePage.pdfPage) ?? []) : [];

  return (
    <div className="page-stack catalogue-stack">
      {/* Top Search & Browse Toolbar */}
      <Panel className="catalogue-toolbar-card">
        <div className="catalogue-search-wrap">
          <span className="catalogue-search-icon">
            <SearchIcon size={19} />
          </span>
          <input
            ref={searchInputRef}
            id="catalogue-search"
            type="search"
            className="input-control catalogue-search-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowAllMatches(false);
            }}
            placeholder="Search any product, disease or category (e.g. Painofree, Mediliv, Sugar, Gas, Piles, Sbron)..."
            aria-label="Search product catalogue"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              className="catalogue-clear-btn"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setShowAllMatches(false);
                searchInputRef.current?.focus();
              }}
            >
              <CloseIcon size={15} />
            </button>
          ) : null}
        </div>

        <div className="catalogue-controls-row">
          <div className="catalogue-select-group">
            <FieldLabel htmlFor="catalogue-category">Category</FieldLabel>
            <SelectWrap>
              <select
                id="catalogue-category"
                className="input-control"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setJumpValue("");
                  setShowAllMatches(false);
                }}
              >
                <option value="all">
                  All Categories · Full Catalogue ({CATALOGUE_PAGES.length} Pages)
                </option>
                <option value="intro">Cover, About &amp; Index</option>
                {CATALOGUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (Pg {cat.catPages})
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>

          <div className="catalogue-select-group">
            <FieldLabel htmlFor="catalogue-jump">Jump to Page</FieldLabel>
            <SelectWrap>
              <select
                id="catalogue-jump"
                className="input-control"
                value={jumpValue}
                onChange={(event) => handleJumpToPage(event.target.value)}
              >
                <option value="">Select any page (1–38)...</option>
                {CATALOGUE_PAGES.map((page) => (
                  <option key={page.pdfPage} value={String(page.pdfPage)}>
                    {page.catPage
                      ? `Page ${page.catPage} — ${page.categoryName}`
                      : `${page.label} — ${page.title}`}
                  </option>
                ))}
              </select>
            </SelectWrap>
          </div>

          <div className="catalogue-view-group">
            <FieldLabel>View Mode</FieldLabel>
            <div className="catalogue-view-toggle" role="group" aria-label="Catalogue layout">
              <button
                type="button"
                className={`quiet-button ${viewMode === "scroll" ? "active-filter" : ""}`}
                onClick={() => setViewMode("scroll")}
              >
                Full Pages
              </button>
              <button
                type="button"
                className={`quiet-button ${viewMode === "grid" ? "active-filter" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                2-Page Grid
              </button>
            </div>
          </div>
        </div>

        <div className="catalogue-status-bar">
          <p className="catalogue-status-text">
            {isSearching ? (
              <>
                Found <strong>{matchedProducts.length}</strong>{" "}
                {matchedProducts.length === 1 ? "product" : "products"} on{" "}
                <strong>{visiblePages.length}</strong>{" "}
                {visiblePages.length === 1 ? "page" : "pages"} for{" "}
                <strong>&ldquo;{trimmedQuery}&rdquo;</strong>
              </>
            ) : categoryId !== "all" ? (
              <>
                Showing <strong>{visiblePages.length}</strong>{" "}
                {visiblePages.length === 1 ? "page" : "pages"} in selected category · Tap any page
                to zoom full screen
              </>
            ) : (
              <>
                Full SB Herbals Catalogue · <strong>{CATALOGUE_PRODUCTS.length} Products</strong>{" "}
                across <strong>{CATALOGUE_PAGES.length} HD Pages</strong> · Scroll below or tap any
                page to zoom
              </>
            )}
          </p>
          {isSearching || categoryId !== "all" ? (
            <button type="button" className="text-button" onClick={resetFilters}>
              Show Full Catalogue
            </button>
          ) : null}
        </div>
      </Panel>

      {/* Instant Matching Product Cards when user searches */}
      {isSearching && matchedProducts.length > 0 ? (
        <Panel className="catalogue-results-card">
          <div className="catalogue-results-head">
            <div>
              <h2>Matching Products ({matchedProducts.length})</h2>
              <p>Tap any product to open its exact catalogue page in HD zoom view.</p>
            </div>
          </div>

          <div className="catalogue-product-grid">
            {displayedProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="catalogue-product-item"
                onClick={() => openViewer(product.pdfPage, product)}
              >
                <div className="catalogue-product-top">
                  <strong className="catalogue-product-name">{product.name}</strong>
                  <span className="catalogue-mrp-pill">MRP {product.mrp}</span>
                </div>
                <p className="catalogue-product-meta">
                  <span>Pack: {product.pack}</span>
                  <span>·</span>
                  <span>{product.categoryName}</span>
                </p>
                <p className="catalogue-product-uses">{product.uses}</p>
                <div className="catalogue-product-foot">
                  <span className="catalogue-page-badge">
                    Cat. Page {product.catPage} · {product.position}
                  </span>
                  <span className="catalogue-open-cta">
                    <ZoomInIcon size={13} /> View Page
                  </span>
                </div>
              </button>
            ))}
          </div>

          {matchedProducts.length > 12 ? (
            <div className="catalogue-more-wrap">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowAllMatches((current) => !current)}
              >
                {showAllMatches
                  ? "Show Fewer Products"
                  : `Show All ${matchedProducts.length} Matching Products`}
              </button>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {/* Empty State if search matches nothing */}
      {visiblePages.length === 0 ? (
        <Panel className="catalogue-empty-card">
          <div className="empty-state">
            <div>
              <div className="empty-state-icon">
                <SearchIcon size={20} />
              </div>
              <strong>No product found for &ldquo;{trimmedQuery}&rdquo;</strong>
              <p>
                Check the spelling or search by disease/category like Painofree, Mediliv, Diabact,
                Liver, Sugar, Piles, Gas, Female, or Softgel.
              </p>
              <button type="button" className="primary-button" onClick={resetFilters}>
                Show Full Catalogue (All 42 Pages)
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        /* Catalogue Pages (Full Scroll Mode or 2-Page Grid Mode) */
        <div
          className={
            viewMode === "grid" ? "catalogue-pages-grid" : "catalogue-pages-scroll"
          }
        >
          {visiblePages.map((page, index) => {
            const pageProducts = PRODUCTS_BY_PDF_PAGE.get(page.pdfPage) ?? [];
            const matchedOnThisPage = isSearching
              ? matchedProducts.filter((p) => p.pdfPage === page.pdfPage)
              : [];

            return (
              <article
                key={page.pdfPage}
                id={`catalogue-page-${page.pdfPage}`}
                className="panel-card catalogue-page-card"
              >
                <header className="catalogue-page-header">
                  <div className="catalogue-page-title-wrap">
                    <span className="catalogue-page-num">
                      {page.catPage ? `Page ${page.catPage}` : page.label}
                    </span>
                    <div className="catalogue-page-heading">
                      <h3>{page.title}</h3>
                      {viewMode === "scroll" && pageProducts.length > 0 ? (
                        <p>
                          {matchedOnThisPage.length > 0
                            ? `Matches: ${matchedOnThisPage.map((p) => p.name).join(", ")}`
                            : `${pageProducts.length} ${pageProducts.length === 1 ? "product" : "products"} on this page`}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="download-button catalogue-zoom-btn"
                    onClick={() => openViewer(page.pdfPage, matchedOnThisPage[0] ?? null)}
                  >
                    <ZoomInIcon size={14} />
                    <span>{viewMode === "grid" ? "Open" : "Zoom"}</span>
                  </button>
                </header>

                <button
                  type="button"
                  className="catalogue-image-button"
                  onClick={() => openViewer(page.pdfPage, matchedOnThisPage[0] ?? null)}
                  aria-label={`Open ${page.label} — ${page.title} in full screen`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.image}
                    alt={`SB Herbals Catalogue ${page.label} — ${page.title}`}
                    width={1363}
                    height={1775}
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="catalogue-page-img"
                  />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Full-Screen HD Zoom & Share Modal */}
      {activePage ? (
        <div
          className="catalogue-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Catalogue ${activePage.label}`}
          onClick={closeViewer}
        >
          <div
            className="catalogue-lightbox-top"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="catalogue-lightbox-title">
              <strong>
                {activePage.catPage
                  ? `Catalogue Page ${activePage.catPage}`
                  : activePage.label}
              </strong>
              <span>{activePage.title}</span>
            </div>

            <div className="catalogue-lightbox-actions">
              <button
                type="button"
                className="catalogue-lb-btn"
                aria-label="Zoom out"
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
              >
                <ZoomOutIcon size={16} />
              </button>
              <button
                type="button"
                className="catalogue-lb-btn catalogue-lb-zoom-readout"
                onClick={() => setZoomIndex(0)}
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="catalogue-lb-btn"
                aria-label="Zoom in"
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                onClick={() => setZoomIndex((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
              >
                <ZoomInIcon size={16} />
              </button>
              <button
                type="button"
                className="catalogue-lb-btn"
                aria-label="Share page"
                disabled={sharing}
                onClick={() => void handleShareOrDownloadPage(activePage, "share")}
                title="Share on WhatsApp"
              >
                <ShareIcon size={15} />
              </button>
              <button
                type="button"
                className="catalogue-lb-btn"
                aria-label="Download page"
                disabled={sharing}
                onClick={() => void handleShareOrDownloadPage(activePage, "download")}
                title="Download Page"
              >
                <DownloadIcon size={15} />
              </button>
              <button
                type="button"
                className="catalogue-lb-btn catalogue-lb-close"
                aria-label="Close full screen viewer"
                onClick={closeViewer}
              >
                <CloseIcon size={17} />
              </button>
            </div>
          </div>

          {highlightProduct ? (
            <div
              className="catalogue-highlight-bar"
              onClick={(event) => event.stopPropagation()}
            >
              <strong>{highlightProduct.name}</strong>
              <span>
                Pack: {highlightProduct.pack} · MRP {highlightProduct.mrp} · Position:{" "}
                <b>{highlightProduct.position}</b>
              </span>
            </div>
          ) : activePageProducts.length > 0 ? (
            <div
              className="catalogue-highlight-bar catalogue-highlight-subtle"
              onClick={(event) => event.stopPropagation()}
            >
              <span>
                On this page: {activePageProducts.map((p) => p.name).join(" · ")}
              </span>
            </div>
          ) : null}

          <div
            ref={viewerBodyRef}
            className={`catalogue-lightbox-body ${zoom > 1 ? "is-zoomed" : ""}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeViewer();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePage.image}
              alt={`SB Herbals Catalogue ${activePage.label} — ${activePage.title}`}
              className="catalogue-lightbox-img"
              style={
                zoom > 1
                  ? {
                      width: `${Math.round(zoom * 100)}%`,
                      maxWidth: `${Math.round(zoom * 900)}px`,
                      maxHeight: "none",
                    }
                  : undefined
              }
              onDoubleClick={() => setZoomIndex((z) => (z === 0 ? 1 : 0))}
            />
          </div>

          <div
            className="catalogue-lightbox-bottom"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="catalogue-nav-btn"
              disabled={activePage.pdfPage <= 1}
              onClick={() => stepPage(-1)}
            >
              ◀ Prev Page
            </button>
            <span className="catalogue-lightbox-counter">
              Sheet {activePage.pdfPage} of {CATALOGUE_PAGES.length}
              {activePage.catPage ? ` (Cat. Pg ${activePage.catPage})` : ""}
            </span>
            <button
              type="button"
              className="catalogue-nav-btn"
              disabled={activePage.pdfPage >= CATALOGUE_PAGES.length}
              onClick={() => stepPage(1)}
            >
              Next Page ▶
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
