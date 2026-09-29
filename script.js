 const companySelect = document.getElementById("company");
const modelSelect = document.getElementById("model");
const yearSelect = document.getElementById("year");
const fuelSelect = document.getElementById("fuel");
const kmsInput = document.getElementById("kms");

const form = document.getElementById("carForm");
const result = document.getElementById("result");

const summaryCompany = document.getElementById("summaryCompany");
const summaryModel = document.getElementById("summaryModel");
const summaryYear = document.getElementById("summaryYear");
const summaryFuel = document.getElementById("summaryFuel");
const summaryKms = document.getElementById("summaryKms");

let carData = [];


// ===============================
// LOAD CSV
// ===============================

async function loadCSV() {

    try {

        console.log("Loading CSV...");

        const response = await fetch("./Cleaned_Car_data.csv");

        if (!response.ok) {
            throw new Error(
                "CSV not found. Status: " + response.status
            );
        }

        const text = await response.text();

        console.log("CSV received.");
        console.log("CSV length:", text.length);

        carData = parseCSV(text);

        console.log("Total cars:", carData.length);

        if (carData.length === 0) {
            throw new Error("CSV me koi data nahi mila.");
        }

        populateCompanies();
        populateYears();
        populateFuelTypes();

        console.log("Dropdowns populated successfully.");

    } catch (error) {

        console.error("ERROR:", error);

        alert(
            "CSV load nahi ho rahi!\n\n" +
            "Check karo:\n" +
            "1. CSV same folder me hai\n" +
            "2. Live Server se website open hai\n" +
            "3. CSV ka naam Cleaned_Car_data.csv hai"
        );
    }
}


// ===============================
// PROPER CSV PARSER
// ===============================

function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && insideQuotes && next === '"') {
            value += '"';
            i++;
        }

        else if (char === '"') {
            insideQuotes = !insideQuotes;
        }

        else if (char === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
        }

        else if ((char === "\n" || char === "\r") && !insideQuotes) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value.trim());
            value = "";

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }

            row = [];
        }

        else {
            value += char;
        }
    }

    if (value.length > 0 || row.length > 0) {
        row.push(value.trim());
        rows.push(row);
    }

    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0].map(h =>
        h.replace(/^\uFEFF/, "").trim()
    );

    console.log("Headers:", headers);

    const data = [];

    for (let i = 1; i < rows.length; i++) {

        const currentRow = rows[i];

        const car = {
            name: currentRow[1]?.trim(),
            company: currentRow[2]?.trim(),
            year: currentRow[3]?.trim(),
            price: currentRow[4]?.trim(),
            kms_driven: currentRow[5]?.trim(),
            fuel_type: currentRow[6]?.trim()
        };

        if (car.company && car.name) {
            data.push(car);
        }
    }

    return data;
}


// ===============================
// ADD OPTION
// ===============================

function addOption(select, value, text) {

    const option = document.createElement("option");

    option.value = value;
    option.textContent = text;

    select.appendChild(option);
}


// ===============================
// COMPANY
// ===============================

function populateCompanies() {

    companySelect.innerHTML =
        '<option value="">Select company</option>';

    const companies = [
        ...new Set(
            carData
                .map(car => car.company)
                .filter(Boolean)
        )
    ].sort();

    companies.forEach(company => {

        addOption(
            companySelect,
            company,
            company
        );

    });

    console.log("Companies:", companies);
}


// ===============================
// MODEL
// ===============================

companySelect.addEventListener("change", function () {

    const company = this.value;

    modelSelect.innerHTML =
        '<option value="">Select car model</option>';

    if (!company) {

        modelSelect.disabled = true;

        updateSummary();

        return;
    }

    const models = [
        ...new Set(
            carData
                .filter(car => car.company === company)
                .map(car => car.name)
                .filter(Boolean)
        )
    ].sort();

    models.forEach(model => {

        addOption(
            modelSelect,
            model,
            model
        );

    });

    modelSelect.disabled = false;

    console.log(
        company,
        "Models:",
        models.length
    );

    updateSummary();
});


// ===============================
// YEAR
// ===============================

function populateYears() {

    yearSelect.innerHTML =
        '<option value="">Select year</option>';

    const years = [
        ...new Set(
            carData
                .map(car => car.year)
                .filter(Boolean)
        )
    ].sort((a, b) => Number(b) - Number(a));

    years.forEach(year => {

        addOption(
            yearSelect,
            year,
            year
        );

    });

    console.log("Years:", years);
}


// ===============================
// FUEL
// ===============================

function populateFuelTypes() {

    fuelSelect.innerHTML =
        '<option value="">Select fuel type</option>';

    const fuels = [
        ...new Set(
            carData
                .map(car => car.fuel_type)
                .filter(Boolean)
        )
    ].sort();

    fuels.forEach(fuel => {

        addOption(
            fuelSelect,
            fuel,
            fuel
        );

    });

    console.log("Fuel:", fuels);
}


// ===============================
// SUMMARY
// ===============================

function updateSummary() {

    summaryCompany.textContent =
        companySelect.value || "—";

    summaryModel.textContent =
        modelSelect.value || "—";

    summaryYear.textContent =
        yearSelect.value || "—";

    summaryFuel.textContent =
        fuelSelect.value || "—";

    summaryKms.textContent =
        kmsInput.value
            ? Number(kmsInput.value).toLocaleString() + " km"
            : "—";
}


// ===============================
// EVENTS
// ===============================

modelSelect.addEventListener(
    "change",
    updateSummary
);

yearSelect.addEventListener(
    "change",
    updateSummary
);

fuelSelect.addEventListener(
    "change",
    updateSummary
);

kmsInput.addEventListener(
    "input",
    updateSummary
);


// ===============================
// PREDICT
// ===============================

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    result.classList.add("hidden");
    result.classList.remove("success");

    if (
        !companySelect.value ||
        !modelSelect.value ||
        !yearSelect.value ||
        !fuelSelect.value ||
        !kmsInput.value
    ) {
        alert("Please fill all car details.");
        return;
    }

    const button = document.getElementById("predictBtn");
    const originalText = button.innerHTML;

    button.innerHTML = "<span>Predicting...</span><span>⏳</span>";
    button.disabled = true;

    const payload = {
        company: companySelect.value,
        model: modelSelect.value,
        year: yearSelect.value,
        fuel: fuelSelect.value,
        kms: kmsInput.value
    };

    const resultIcon = document.getElementById("resultIcon");
    const resultBody = document.getElementById("resultBody");

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            result.classList.remove("hidden");
            result.classList.add("success");
            resultIcon.textContent = "💰";

            const dbNotice = data.db_saved
                ? `<div class="db-badge saved"><span>🗄️</span> Logged to MySQL Database (ID: #${data.db_record_id})</div>`
                : `<div class="db-badge warn"><span>⚠️</span> Database status: ${data.db_error || "Could not log to MySQL"}</div>`;

            resultBody.innerHTML = `
                <h3>Estimated Resale Price</h3>
                <div class="predicted-value">${data.formatted_price}</div>
                <p>
                    Estimated market value for <strong>${payload.company} ${payload.model}</strong> 
                    (${payload.year} • ${payload.fuel} • ${Number(payload.kms).toLocaleString()} KM).
                </p>
                ${dbNotice}
            `;
        } else {
            result.classList.remove("hidden");
            result.classList.remove("success");
            resultIcon.textContent = "⚠️";
            resultBody.innerHTML = `
                <h3>Prediction Error</h3>
                <p>${data.error || "Server returned an error processing your request."}</p>
            `;
        }

    } catch (err) {
        console.error("Prediction request failed:", err);
        result.classList.remove("hidden");
        result.classList.remove("success");
        resultIcon.textContent = "⚠️";
        resultBody.innerHTML = `
            <h3>Server Connection Failed</h3>
            <p>Could not connect to the Flask server. Make sure <code>python app.py</code> is running on <code>http://127.0.0.1:5000</code>.</p>
        `;
    } finally {
        button.innerHTML = originalText;
        button.disabled = false;

        result.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

});


// ===============================
// START
// ===============================

loadCSV();