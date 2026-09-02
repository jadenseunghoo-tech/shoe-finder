let shoes = [];

const shoeData = [
    {
        name: "Nike Pegasus 41",
        price: 399,
        originalPrice: 549,
        image: "https://placehold.co/400x300?text=Nike+Pegasus+41"
    },
    {
        name: "Nike Vomero Plus",
        price: 499,
        originalPrice: 699,
        image: "https://placehold.co/400x300?text=Nike+Vomero+Plus"
    },
    {
        name: "Nike Streakfly 2",
        price: 459,
        originalPrice: 579,
        image: "https://www.sportsdirect.com/images/imgzoom/21/21282019_xxl.jpg"
    },
    {
        name: "Nike Vaporfly 4",
        price: 799,
        originalPrice: 999,
        image: "https://placehold.co/400x300?text=Nike+Vaporfly+4"
    },
    {
        name: "Adidas Evo SL",
        price: 449,
        originalPrice: 599,
        image: "https://placehold.co/400x300?text=Adidas+Evo+SL"
    },
    {
        name: "Adidas Adizero Boston 13",
        price: 529,
        originalPrice: 699,
        image: "https://www.sneakinpeace.com/cdn/shop/files/adidas-adizero-bost-13-CloudWhite_CoreBlack_DashGrey-running-shoes-trainers-1_1600x2000.jpg"
    },
    {
        name: "ASICS Novablast 5",
        price: 459,
        originalPrice: 599,
        image: "https://placehold.co/400x300?text=ASICS+Novablast+5"
    },
    {
        name: "ASICS Magic Speed 5",
        price: 499,
        originalPrice: 649,
        image: "https://thesweatshop.co.za/cdn/shop/files/1013A183_100_SR_RT_GLB.jpg"
    },
    {
        name: "ASICS Gel Nimbus 27",
        price: 519,
        originalPrice: 699,
        image: "https://www.fit2run.com/cdn/shop/files/1011B958_402_SR_RT_GLB_PNG_1280x1280-PNG.png"
    },
    {
        name: "Hoka Clifton 10",
        price: 479,
        originalPrice: 649,
        image: "https://placehold.co/400x300?text=Hoka+Clifton+10"
    },
    {
        name: "Hoka Mach 6",
        price: 459,
        originalPrice: 599,
        image: "https://athleticannex.com/cdn/shop/files/hoka-mens-mach-6-1147790-wky-athletic-annex_1200x1200.jpg"
    },
    {
        name: "Saucony Endorphin Speed 4",
        price: 489,
        originalPrice: 649,
        image: "https://placehold.co/400x300?text=Endorphin+Speed+4"
    },
    {
        name: "New Balance Rebel v5",
        price: 429,
        originalPrice: 579,
        image: "https://placehold.co/400x300?text=New+Balance+Rebel+v5"
    }
];

const sizes = [
    "6",
    "6.5",
    "7",
    "7.5",
    "8",
    "8.5",
    "9"
];

function createShoes() {
    shoes = [];

    shoeData.forEach(function(data) {

        let nikeLink = "https://www.nike.com/my/w/running-shoes-37v7jz3rauvznik1zy7ok";
        let adidasLink = "https://www.adidas.com.my/";
        let asicsLink = "https://www.asics.com/my/en-my/";
        let hokaLink = "https://www.hoka.com/";
        let sauconyLink = "https://www.saucony.com/";
        let newBalanceLink = "https://www.newbalance.com/";

        let link = "#";

        if (data.name.includes("Nike")) {
            link = nikeLink;
        }

        if (data.name.includes("Adidas")) {
            link = adidasLink;
        }

        if (data.name.includes("ASICS")) {
            link = asicsLink;
        }

        if (data.name.includes("Hoka")) {
            link = hokaLink;
        }

        if (data.name.includes("Saucony")) {
            link = sauconyLink;
        }

        if (data.name.includes("New Balance")) {
            link = newBalanceLink;
        }

        sizes.forEach(function(size) {

            shoes.push({
                name: data.name,
                store: "Example Sports",
                size: size,
                gender: "Men",
                location: "Malaysia",
                price: data.price,
                originalPrice: data.originalPrice,
                image: data.image,
                link: link
            });

            shoes.push({
                name: data.name,
                store: "Runner Store",
                size: size,
                gender: "Unisex",
                location: "Malaysia",
                price: data.price + 20,
                originalPrice: data.originalPrice,
                image: data.image,
                link: link
            });

            shoes.push({
                name: data.name,
                store: "Singapore Sports",
                size: size,
                gender: "Unisex",
                location: "Singapore",
                price: data.price - 15,
                originalPrice: data.originalPrice,
                image: data.image,
                link: link
            });

        });

    });
}

function loadProducts() {

    fetch("products.json")
        .then(function(response) {

            if (!response.ok) {
                throw new Error("products.json could not be loaded");
            }

            return response.json();
        })

        .then(function() {

            createShoes();

            document.getElementById("results").innerHTML =
                "<h2>✅ Database loaded! Choose your options.</h2>";

            console.log("Products loaded:", shoes);
        })

        .catch(function(error) {

            console.log(error);

            createShoes();

            document.getElementById("results").innerHTML =
                "<h2>✅ Demo database loaded!</h2>";
        });
}

function findDeals() {

    const selectedShoe =
        document.getElementById("shoe").value;

    const selectedSize =
        document.getElementById("size").value;

    const selectedGender =
        document.getElementById("gender").value;

    const selectedLocation =
        document.getElementById("location").value;

    const results =
        document.getElementById("results");

    let deals = shoes.filter(function(item) {

        return (
            item.name === selectedShoe &&
            item.size === selectedSize &&
            (
                item.gender === selectedGender ||
                item.gender === "Unisex"
            ) &&
            item.location === selectedLocation
        );

    });

    deals.sort(function(a, b) {
        return a.price - b.price;
    });

    deals = deals.slice(0, 3);

    if (deals.length === 0) {

        results.innerHTML =
            "<h2>😢 No deals found</h2>" +
            "<p>Try another option.</p>";

        return;
    }

    results.innerHTML =
        "<h2>🔥 Best Deals</h2>" +
        "<p class='result-count'>" +
        deals.length +
        " deal(s) found</p>";

    deals.forEach(function(deal, index) {

        const discount = Math.round(
            (
                (deal.originalPrice - deal.price) /
                deal.originalPrice
            ) * 100
        );

        results.innerHTML +=

            '<div class="deal-card">' +

                '<div class="shoe-image">' +
                    '<img src="' +
                    deal.image +
                    '" alt="' +
                    deal.name +
                    '">' +
                '</div>' +

                '<div class="deal-info">' +

                    '<div class="rank">' +
                        '#' +
                        (index + 1) +
                        ' BEST DEAL' +
                    '</div>' +

                    '<h3>' +
                        deal.name +
                    '</h3>' +

                    '<p class="store">' +
                        '🏪 ' +
                        deal.store +
                    '</p>' +

                    '<p class="details">' +
                        '📍 ' +
                        deal.location +
                        ' • 👟 UK ' +
                        deal.size +
                        ' • ' +
                        deal.gender +
                    '</p>' +

                    '<div class="price">' +

                        '<span class="sale-price">' +
                            'RM' +
                            deal.price +
                        '</span>' +

                        '<span class="original-price">' +
                            'RM' +
                            deal.originalPrice +
                        '</span>' +

                        '<span class="discount">' +
                            discount +
                            '% OFF' +
                        '</span>' +

                    '</div>' +

                '</div>' +

                '<div class="deal-action">' +

                    '<a href="' +
                        deal.link +
                        '" class="deal-button">' +
                        'View Deal →' +
                    '</a>' +

                '</div>' +

            '</div>';
    });
}

loadProducts();