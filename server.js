const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("."));

/*
    ========================================
    LOCATION SETTINGS
    ========================================
*/

const locations = {
    Malaysia: {
        location: "Kuala Lumpur, Malaysia",
        gl: "my"
    },

    Singapore: {
        location: "Singapore, Singapore",
        gl: "sg"
    },

    UK: {
        location: "London, United Kingdom",
        gl: "uk"
    },

    US: {
        location: "New York, United States",
        gl: "us"
    },

    Australia: {
        location: "Sydney, Australia",
        gl: "au"
    },

    Japan: {
        location: "Tokyo, Japan",
        gl: "jp"
    },

    "South Korea": {
        location: "Seoul, South Korea",
        gl: "kr"
    },

    "Hong Kong": {
        location: "Hong Kong",
        gl: "hk"
    },

    Canada: {
        location: "Toronto, Canada",
        gl: "ca"
    },

    Germany: {
        location: "Berlin, Germany",
        gl: "de"
    },

    France: {
        location: "Paris, France",
        gl: "fr"
    }
};

/*
    ========================================
    KNOWN BRANDS
    ========================================
*/

const knownBrands = [
    {
        name: "Nike",
        words: ["nike"]
    },

    {
        name: "Adidas",
        words: ["adidas"]
    },

    {
        name: "ASICS",
        words: ["asics"]
    },

    {
        name: "HOKA",
        words: ["hoka"]
    },

    {
        name: "New Balance",
        words: ["new", "balance"]
    },

    {
        name: "Saucony",
        words: ["saucony"]
    },

    {
        name: "Puma",
        words: ["puma"]
    },

    {
        name: "Reebok",
        words: ["reebok"]
    }
];

/*
    ========================================
    WORDS IGNORED FOR MODEL MATCHING
    ========================================
*/

const ignoredWords = new Set([
    "men",
    "mens",
    "women",
    "womens",
    "male",
    "female",
    "boy",
    "boys",
    "girl",
    "girls",
    "unisex",
    "running",
    "run",
    "shoe",
    "shoes",
    "trainer",
    "trainers",
    "road"
]);

/*
    ========================================
    NORMALIZE
    ========================================
*/

function normalize(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/*
    ========================================
    MODEL WORDS
    ========================================
*/

function getImportantWords(text) {
    return normalize(text)
        .split(" ")
        .filter(function(word) {
            return (
                word &&
                !ignoredWords.has(word)
            );
        });
}

/*
    ========================================
    MODEL MATCHING
    ========================================
*/

function shoeMatches(
    title,
    requestedShoe
) {
    const titleWords =
        new Set(
            getImportantWords(title)
        );

    const requestedWords =
        getImportantWords(requestedShoe);

    return requestedWords.every(
        function(word) {
            return titleWords.has(word);
        }
    );
}

/*
    ========================================
    BRAND DETECTION
    ========================================
*/

function getBrandFromText(text) {
    const normalized =
        normalize(text);

    for (const brand of knownBrands) {

        const allWordsPresent =
            brand.words.every(
                function(word) {
                    return normalized.includes(
                        word
                    );
                }
            );

        if (allWordsPresent) {
            return brand;
        }
    }

    return null;
}

/*
    ========================================
    LOCATION LOOKUP
    ========================================
*/

function getLocationSettings(
    location
) {
    return (
        locations[location] ||
        locations.Malaysia
    );
}

/*
    ========================================
    SERPER SHOPPING REQUEST
    ========================================
*/

async function fetchSerperShopping(
    query,
    locationSettings
) {
    const apiKey =
        process.env.SERPER_API_KEY;

    if (!apiKey) {
        throw new Error(
            "SERPER_API_KEY is missing from .env"
        );
    }

    const response =
        await fetch(
            "https://google.serper.dev/shopping",
            {
                method: "POST",

                headers: {
                    "X-API-KEY":
                        apiKey,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        q: query,

                        location:
                            locationSettings.location,

                        gl:
                            locationSettings.gl,

                        hl:
                            "en",

                        num:
                            40
                    })
            }
        );

    const text =
        await response.text();

    let data;

    try {
        data =
            JSON.parse(text);
    } catch (error) {
        throw new Error(
            "Serper returned invalid JSON."
        );
    }

    if (!response.ok) {

        if (response.status === 429) {
            throw new Error(
                "Serper rate limit reached (429)."
            );
        }

        throw new Error(
            "Serper returned HTTP " +
            response.status +
            ": " +
            (
                data.message ||
                text
            )
        );
    }

    return data;
}

/*
    ========================================
    MALE TERMS
    ========================================
*/

function containsMaleTerm(text) {

    const normalized =
        " " +
        normalize(text) +
        " ";

    const maleTerms = [
        " men ",
        " mens ",
        " man ",
        " male ",
        " males ",
        " boy ",
        " boys ",
        " masculine ",
        " men's "
    ];

    return maleTerms.some(
        function(term) {
            return normalized.includes(
                term
            );
        }
    );
}

/*
    ========================================
    FEMALE TERMS
    ========================================
*/

function containsFemaleTerm(text) {

    const normalized =
        " " +
        normalize(text) +
        " ";

    const femaleTerms = [
        " women ",
        " womens ",
        " woman ",
        " female ",
        " females ",
        " girl ",
        " girls ",
        " feminine ",
        " women's "
    ];

    return femaleTerms.some(
        function(term) {
            return normalized.includes(
                term
            );
        }
    );
}

/*
    ========================================
    EXPLICIT US SIZES
    ========================================

    Finds ONLY:

    US 7
    US7
    US 7.5

    It does NOT treat:

    UK 7
    EU 42
    Size 7

    as an explicit US size.
    ========================================
*/

function getExplicitUsSizes(title) {

    const text =
        normalize(title);

    const matches = [];

    const regex =
        /(?:^|\s)us\s*([0-9]+(?:\.[0-9]+)?)(?=\s|$)/g;

    let match;

    while (
        (match = regex.exec(text)) !== null
    ) {
        matches.push(
            match[1]
        );
    }

    return matches;
}

/*
    ========================================
    EXACT BARE SIZE
    ========================================
*/

function hasExactBareSize(
    title,
    requestedSize
) {
    const text =
        normalize(title);

    const wanted =
        normalize(requestedSize);

    const escaped =
        wanted.replace(
            ".",
            "\\."
        );

    const regex =
        new RegExp(
            "(^|\\s)" +
            escaped +
            "(?=\\s|$)"
        );

    return regex.test(text);
}

/*
    ========================================
    SIZE STATUS
    ========================================

    VERIFIED:

    US 7 + male term
    for a Men search.

    UNVERIFIED:

    7
    US 7
    Men's 7

    WRONG:

    7.5
    US 7.5
    Women's US 7
    ========================================
*/

function getSizeStatus(
    title,
    requestedSize,
    requestedGender
) {
    const wanted =
        normalize(requestedSize);

    const gender =
        normalize(requestedGender);

    const explicitUsSizes =
        getExplicitUsSizes(title);

    /*
        --------------------------------
        EXPLICIT US SIZE
        --------------------------------
    */

    if (
        explicitUsSizes.length > 0
    ) {

        /*
            Any conflicting explicit US size
            means reject.

            Searching 7:

            US 7
                ✅

            US 7.5
                ❌

            US 7.5 US 7
                ❌
        */

        const conflict =
            explicitUsSizes.some(
                function(foundSize) {
                    return (
                        foundSize !== wanted
                    );
                }
            );

        if (conflict) {
            return "wrong";
        }

        const hasMale =
            containsMaleTerm(title);

        const hasFemale =
            containsFemaleTerm(title);

        /*
            MEN
        */

        if (gender === "men") {

            if (
                hasFemale &&
                !hasMale
            ) {
                return "wrong";
            }

            /*
                Explicit US size + male
                information = FULLY VERIFIED
            */

            if (hasMale) {
                return "verified";
            }

            /*
                US 7 with no gender
                information = visible but
                NOT verified.
            */

            return "unverified";
        }

        /*
            WOMEN
        */

        if (gender === "women") {

            if (
                hasMale &&
                !hasFemale
            ) {
                return "wrong";
            }

            if (hasFemale) {
                return "verified";
            }

            return "unverified";
        }

        /*
            UNISEX
        */

        return "unverified";
    }

    /*
        --------------------------------
        BARE SIZE
        --------------------------------
    */

    if (
        hasExactBareSize(
            title,
            requestedSize
        )
    ) {

        const hasMale =
            containsMaleTerm(title);

        const hasFemale =
            containsFemaleTerm(title);

        /*
            Bare size is NEVER fully verified
            as US sizing.

            Even:

            Men's 7

            remains:

            ⚠️ NOT VERIFIED
        */

        if (
            gender === "men" &&
            hasFemale &&
            !hasMale
        ) {
            return "wrong";
        }

        if (
            gender === "women" &&
            hasMale &&
            !hasFemale
        ) {
            return "wrong";
        }

        return "unverified";
    }

    return "none";
}

/*
    ========================================
    PRICE NUMBER
    ========================================
*/

function extractPriceNumber(
    price
) {
    if (
        typeof price === "number"
    ) {
        return price;
    }

    const text =
        String(price || "");

    /*
        Try to handle common formats.

        Example:

        ¥19,800
        RM599
        $199.99
    */

    const cleaned =
        text.replace(
            /,/g,
            ""
        );

    const match =
        cleaned.match(
            /[0-9]+(?:\.[0-9]+)?/
        );

    if (!match) {
        return NaN;
    }

    return parseFloat(
        match[0]
    );
}

/*
    ========================================
    MAIN SEARCH ROUTE
    ========================================
*/

app.get(
    "/api/shoes",
    async function(req, res) {

        try {

            const shoe =
                String(
                    req.query.shoe || ""
                ).trim();

            const size =
                String(
                    req.query.size || ""
                ).trim();

            const gender =
                String(
                    req.query.gender ||
                    "Men"
                ).trim();

            const requestedLocation =
                String(
                    req.query.location ||
                    "Malaysia"
                ).trim();

            /*
                --------------------------------
                VALIDATION
                --------------------------------
            */

            if (!shoe) {

                return res.status(400).json({
                    error:
                        "No shoe selected"
                });
            }

            if (!size) {

                return res.status(400).json({
                    error:
                        "No size selected"
                });
            }

            if (
                !locations[
                    requestedLocation
                ]
            ) {

                return res.status(400).json({
                    error:
                        "Unsupported location"
                });
            }

            /*
                --------------------------------
                LOCATION
                --------------------------------
            */

            const locationSettings =
                getLocationSettings(
                    requestedLocation
                );

            console.log(
                "--------------------------------"
            );

            console.log(
                "Location:",
                requestedLocation
            );

            console.log(
                "Search location:",
                locationSettings.location
            );

            console.log(
                "Google country:",
                locationSettings.gl
            );

            console.log(
                "Shoe:",
                shoe
            );

            console.log(
                "Size:",
                size
            );

            console.log(
                "Gender:",
                gender
            );

            console.log(
                "--------------------------------"
            );

            /*
                --------------------------------
                BRAND
                --------------------------------
            */

            const brand =
                getBrandFromText(shoe);

            /*
                --------------------------------
                SEARCH QUERY
                --------------------------------

                We intentionally use ONLY ONE
                Serper request.

                This saves credits and avoids
                the multiple-request problem.
            */

            const query =
                shoe +
                " " +
                gender +
                " US " +
                size +
                " running shoes";

            console.log(
                "Serper Shopping search:",
                query
            );

            /*
                --------------------------------
                SEARCH
                --------------------------------
            */

            const data =
                await fetchSerperShopping(
                    query,
                    locationSettings
                );

            const results =
                Array.isArray(
                    data.shopping
                )
                    ? data.shopping
                    : [];

            console.log(
                "Serper Shopping results:",
                results.length
            );

            /*
                --------------------------------
                PROCESS RESULTS
                --------------------------------
            */

            const products = [];

            for (
                const item of results
            ) {

                const title =
                    String(
                        item.title || ""
                    );

                /*
                    --------------------------------
                    MODEL CHECK
                    --------------------------------
                */

                if (
                    !shoeMatches(
                        title,
                        shoe
                    )
                ) {

                    console.log(
                        "❌ Wrong model:",
                        title
                    );

                    continue;
                }

                /*
                    --------------------------------
                    SIZE CHECK
                    --------------------------------
                */

                const sizeStatus =
                    getSizeStatus(
                        title,
                        size,
                        gender
                    );

                /*
                    WRONG
                */

                if (
                    sizeStatus ===
                    "wrong"
                ) {

                    console.log(
                        "❌ Wrong size/gender:",
                        title
                    );

                    continue;
                }

                /*
                    NO SIZE
                */

                if (
                    sizeStatus ===
                    "none"
                ) {

                    console.log(
                        "❌ No usable size:",
                        title
                    );

                    continue;
                }

                /*
                    --------------------------------
                    STORE INFO
                    --------------------------------
                */

                const store =
                    item.source ||
                    "Unknown retailer";

                const price =
                    item.price ||
                    "";

                const originalPrice =
                    item.oldPrice ||
                    item.originalPrice ||
                    "";

                const link =
                    item.link ||
                    "";

                const image =
                    item.imageUrl ||
                    item.thumbnail ||
                    "";

                /*
                    --------------------------------
                    RESULT
                    --------------------------------
                */

                products.push({

                    name:
                        title,

                    store:
                        store,

                    price:
                        price,

                    oldPrice:
                        originalPrice,

                    link:
                        link,

                    image:
                        image,

                    sizeVerified:
                        sizeStatus ===
                        "verified",

                    sizeVerification:
                        sizeStatus ===
                        "verified"
                            ? "US size + gender explicit"
                            : "size not fully verified",

                    requestedSize:
                        size,

                    gender:
                        gender,

                    location:
                        requestedLocation,

                    currency:
                        locationSettings.gl,

                    extractedPrice:
                        extractPriceNumber(
                            price
                        )
                });
            }

            /*
                --------------------------------
                VERIFIED FIRST
                THEN CHEAPEST
                --------------------------------
            */

            products.sort(
                function(a, b) {

                    if (
                        a.sizeVerified === true &&
                        b.sizeVerified !== true
                    ) {
                        return -1;
                    }

                    if (
                        a.sizeVerified !== true &&
                        b.sizeVerified === true
                    ) {
                        return 1;
                    }

                    const priceA =
                        Number(
                            a.extractedPrice
                        );

                    const priceB =
                        Number(
                            b.extractedPrice
                        );

                    if (
                        isNaN(priceA)
                    ) {
                        return 1;
                    }

                    if (
                        isNaN(priceB)
                    ) {
                        return -1;
                    }

                    return (
                        priceA -
                        priceB
                    );
                }
            );

            /*
                --------------------------------
                REMOVE DUPLICATES
                --------------------------------
            */

            const uniqueProducts =
                [];

            const seen =
                new Set();

            products.forEach(
                function(product) {

                    const key =
                        normalize(
                            product.name
                        ) +
                        "|" +
                        normalize(
                            product.store
                        ) +
                        "|" +
                        product.price;

                    if (
                        !seen.has(key)
                    ) {

                        seen.add(key);

                        uniqueProducts.push(
                            product
                        );
                    }
                }
            );

            /*
                --------------------------------
                FINAL LOG
                --------------------------------
            */

            const verifiedCount =
                uniqueProducts.filter(
                    function(product) {
                        return (
                            product.sizeVerified ===
                            true
                        );
                    }
                ).length;

            const unverifiedCount =
                uniqueProducts.filter(
                    function(product) {
                        return (
                            product.sizeVerified !==
                            true
                        );
                    }
                ).length;

            console.log(
                "FINAL RESULTS:",
                uniqueProducts.length
            );

            console.log(
                "Verified:",
                verifiedCount
            );

            console.log(
                "Unverified:",
                unverifiedCount
            );

            console.log(
                "--------------------------------"
            );

            /*
                --------------------------------
                RETURN RESULTS
                --------------------------------
            */

            res.json(
                uniqueProducts
                    .slice(0, 10)
                    .map(
                        function(product) {

                            /*
                                Don't expose internal
                                extractedPrice field.
                            */

                            const {
                                extractedPrice,
                                ...cleanProduct
                            } = product;

                            return cleanProduct;
                        }
                    )
            );

        } catch (error) {

            console.error(
                "SERVER ERROR:",
                error
            );

            res.status(500).json({
                error:
                    error.message ||
                    "Could not connect to Serper"
            });
        }
    }
);

/*
    ========================================
    START SERVER
    ========================================
*/

app.listen(
    PORT,
    function() {

        console.log(
            "================================"
        );

        console.log(
            "ShoeFinder running at:"
        );

        console.log(
            "http://localhost:" +
            PORT
        );

        console.log(
            "Using Serper Shopping API"
        );

        console.log(
            "================================"
        );
    }
);
