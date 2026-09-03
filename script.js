let currentController = null;

function findDeals() {
    const shoeInput = document.getElementById("shoe");
    const size = document.getElementById("size").value;
    const gender = document.getElementById("gender").value;
    const location = document.getElementById("location").value;
    const results = document.getElementById("results");

    const shoe = shoeInput.value.trim();

    if (!shoe) {
        results.innerHTML =
            "<div class='no-results'>" +
                "<div class='no-results-icon'>⌕</div>" +
                "<h2>Search for a shoe</h2>" +
                "<p>Try something like Nike Pegasus 42.</p>" +
            "</div>";
        return;
    }

    if (!size) {
        results.innerHTML =
            "<div class='no-results'>" +
                "<div class='no-results-icon'>!</div>" +
                "<h2>Select your size</h2>" +
                "<p>Choose a US size before searching.</p>" +
            "</div>";
        return;
    }

    if (currentController) {
        currentController.abort();
    }

    currentController =
        new AbortController();

    const timeout =
        setTimeout(function() {
            currentController.abort();
        }, 30000);

    results.innerHTML =
        "<div class='loading-screen'>" +
            "<div class='loading-spinner'></div>" +
            "<h2>Finding your shoe...</h2>" +
            "<p>Checking retailers and sizes</p>" +
        "</div>";

    const apiUrl =
        "/api/shoes" +
        "?shoe=" +
        encodeURIComponent(shoe) +
        "&size=" +
        encodeURIComponent(size) +
        "&gender=" +
        encodeURIComponent(gender) +
        "&location=" +
        encodeURIComponent(location);

    fetch(apiUrl, {
        signal:
            currentController.signal
    })
        .then(function(response) {

            if (!response.ok) {
                return response.text()
                    .then(function(text) {

                        throw new Error(
                            "Server returned " +
                            response.status +
                            ": " +
                            text
                        );
                    });
            }

            return response.json();
        })

        .then(function(products) {

            clearTimeout(timeout);

            if (
                !Array.isArray(products) ||
                products.length === 0
            ) {

                results.innerHTML =
                    "<div class='no-results'>" +
                        "<div class='no-results-icon'>⌕</div>" +
                        "<h2>No verified deals found</h2>" +
                        "<p>" +
                            "We couldn't find a reliable match for " +
                            escapeHtml(shoe) +
                            " in US " +
                            escapeHtml(size) +
                            "." +
                        "</p>" +
                    "</div>";

                return;
            }

            products.sort(
                function(a, b) {

                    const priceA =
                        parseFloat(
                            String(
                                a.price || ""
                            ).replace(
                                /[^0-9.]/g,
                                ""
                            )
                        );

                    const priceB =
                        parseFloat(
                            String(
                                b.price || ""
                            ).replace(
                                /[^0-9.]/g,
                                ""
                            )
                        );

                    if (isNaN(priceA)) {
                        return 1;
                    }

                    if (isNaN(priceB)) {
                        return -1;
                    }

                    return priceA - priceB;
                }
            );

            results.innerHTML =
                "<div class='results-header'>" +
                    "<div>" +
                        "<p class='results-eyebrow'>" +
                            "SEARCH RESULTS" +
                        "</p>" +

                        "<h2>" +
                            escapeHtml(shoe) +
                        "</h2>" +

                        "<p class='results-subtitle'>" +
                            "US " +
                            escapeHtml(size) +
                            " · " +
                            escapeHtml(gender) +
                            " · " +
                            escapeHtml(location) +
                        "</p>" +
                    "</div>" +

                    "<div class='results-count'>" +
                        products.length +
                        " deals" +
                    "</div>" +
                "</div>";

            products
                .slice(0, 10)
                .forEach(
                    function(product, index) {

                        const image =
                            product.image ||
                            "https://placehold.co/500x400?text=Shoe";

                        const link =
                            product.link ||
                            "#";

                        const sizeBadge =
                            product.sizeVerified === true
                                ? (
                                    "<span class='verified-badge'>" +
                                        "✓ US " +
                                        escapeHtml(size) +
                                        " verified" +
                                    "</span>"
                                )
                                : (
                                    "<span class='unverified-badge'>" +
                                        "⚠ US " +
                                        escapeHtml(size) +
                                        " not verified" +
                                    "</span>"
                                );

                        let oldPriceHtml = "";

                        if (
                            product.oldPrice &&
                            product.price
                        ) {

                            const currentPrice =
                                parseFloat(
                                    String(
                                        product.price
                                    ).replace(
                                        /[^0-9.]/g,
                                        ""
                                    )
                                );

                            const oldPrice =
                                parseFloat(
                                    String(
                                        product.oldPrice
                                    ).replace(
                                        /[^0-9.]/g,
                                        ""
                                    )
                                );

                            if (
                                !isNaN(currentPrice) &&
                                !isNaN(oldPrice) &&
                                oldPrice > currentPrice
                            ) {

                                oldPriceHtml =
                                    "<s class='deal-old-price'>" +
                                        escapeHtml(
                                            product.oldPrice
                                        ) +
                                    "</s>";
                            }
                        }

                        results.innerHTML +=
                            "<article class='deal-card'>" +

                                "<div class='deal-image-container'>" +
                                    "<img " +
                                        "class='deal-image' " +
                                        "src='" +
                                            escapeAttribute(image) +
                                        "' " +
                                        "alt='" +
                                            escapeAttribute(
                                                product.name ||
                                                "Shoe"
                                            ) +
                                        "'" +
                                    ">" +
                                "</div>" +

                                "<div class='deal-content'>" +

                                    "<div class='deal-topline'>" +
                                        "<span class='deal-rank'>" +
                                            "#" +
                                            (index + 1) +
                                        "</span>" +

                                        sizeBadge +
                                    "</div>" +

                                    "<h3 class='deal-title'>" +
                                        escapeHtml(
                                            product.name ||
                                            "Unknown shoe"
                                        ) +
                                    "</h3>" +

                                    "<p class='deal-store'>" +
                                        escapeHtml(
                                            product.store ||
                                            "Unknown retailer"
                                        ) +
                                    "</p>" +

                                    "<div class='deal-price'>" +
                                        escapeHtml(
                                            product.price ||
                                            "Price unavailable"
                                        ) +
                                        oldPriceHtml +
                                    "</div>" +

                                "</div>" +

                                "<div class='deal-action'>" +

                                    "<a " +
                                        "href='" +
                                            escapeAttribute(link) +
                                        "' " +
                                        "class='deal-button' " +
                                        "target='_blank' " +
                                        "rel='noopener noreferrer'" +
                                    ">" +
                                        "View deal ↗" +
                                    "</a>" +

                                "</div>" +

                            "</article>";
                    }
                );
        })

        .catch(function(error) {

            clearTimeout(timeout);

            if (
                error.name === "AbortError"
            ) {

                results.innerHTML =
                    "<div class='no-results'>" +
                        "<div class='no-results-icon'>⏱</div>" +
                        "<h2>Search timed out</h2>" +
                        "<p>The search took longer than 30 seconds.</p>" +
                    "</div>";

                return;
            }

            console.error(
                "Search error:",
                error
            );

            results.innerHTML =
                "<div class='no-results'>" +
                    "<div class='no-results-icon'>!</div>" +
                    "<h2>Something went wrong</h2>" +
                    "<p>" +
                        escapeHtml(
                            error.message ||
                            "Unable to complete the search."
                        ) +
                    "</p>" +
                "</div>";
        });
}

function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(text) {
    return escapeHtml(text);
}
