//======================================================
//          PANDU ASSIGNMENT CENTER
//              PART - 1
//======================================================

//------------------------------------------------------
// ELEMENTS
//------------------------------------------------------

const memberModal =
    document.getElementById("memberModal");

const memberSearch =
    document.getElementById("memberSearch");

const searchResults =
    document.getElementById("searchResults");

const assignButton =
    document.getElementById("assignButton");

const memberId =
    document.getElementById("member_id");

const memberName =
    document.getElementById("memberName");

const memberCode =
    document.getElementById("memberCode");

const memberMobile =
    document.getElementById("memberMobile");

const memberAadhaar =
    document.getElementById("memberAadhaar");

const memberPhoto =
    document.getElementById("memberPhoto");

let searchTimer = null;

let memberModalInstance = null;


//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

window.addEventListener("DOMContentLoaded", () => {

    calculate();

    if (memberModal) {

        memberModalInstance =
            bootstrap.Modal.getOrCreateInstance(memberModal);

    }

});


//------------------------------------------------------
// OPEN MODAL
//------------------------------------------------------

memberModal?.addEventListener("shown.bs.modal", () => {

    memberSearch.focus();

    memberSearch.select();

});


//------------------------------------------------------
// LIVE SEARCH
//------------------------------------------------------

memberSearch?.addEventListener("input", function () {

    clearTimeout(searchTimer);

    const keyword = this.value.trim();

    if (keyword.length < 2) {

        searchResults.innerHTML =

            `
        <div class="empty-search">

            <i class="bi bi-search"></i>

            <h5>

                Type at least 2 characters

            </h5>

        </div>
        `;

        return;

    }

    searchResults.innerHTML =

        `
    <div class="search-loading">

        <div class="spinner-border text-primary">

        </div>

        <div class="mt-3">

            Searching Members...

        </div>

    </div>
    `;

    searchTimer =

        setTimeout(() => {

            loadMembers(keyword);

        }, 300);

});


//------------------------------------------------------
// LOAD MEMBERS
//------------------------------------------------------

async function loadMembers(keyword) {

    try {

        const groupId = document.getElementById("group_id").value;

        fetch(
            `/api/assign-member-search?q=${encodeURIComponent(keyword)}&group_id=${groupId}`
        )

        if (!response.ok) {

            throw new Error();

        }

        const members =
            await response.json();

        renderMembers(members);

    }

    catch (e) {

        searchResults.innerHTML =

            `
        <div class="empty-search">

            <i class="bi bi-wifi-off"></i>

            <h5>

                Unable to load members

            </h5>

        </div>
        `;

    }

}


//------------------------------------------------------
// RENDER MEMBERS
//------------------------------------------------------

function renderMembers(members) {

    if (!members.length) {

        searchResults.innerHTML =

            `
        <div class="empty-search">

            <i class="bi bi-person-x"></i>

            <h5>

                No Members Found

            </h5>

        </div>
        `;

        return;

    }

    let html = "";

    members.forEach(member => {

        const photo =

            member.photo ||

            "/static/images/user.png";

        //--------------------------------------------------
        // MEMBER AVAILABLE
        //--------------------------------------------------

        if (!member.already_assigned) {

            html +=

                `
            <div
                class="member-item fade-up"

                onclick="selectMember(

                    ${member.id},

                    '${member.member_code}',

                    '${member.member_name.replace(/'/g, "\\'")}',

                    '${member.mobile}',

                    '${member.aadhaar_no || ""}',

                    '${photo}'

                )">

                <div class="member-left">

                    <img src="${photo}">

                    <div class="member-details">

                        <h5>

                            ${member.member_name}

                        </h5>

                        <small>

                            ${member.member_code}

                        </small>

                        <small>

                            ${member.mobile}

                        </small>

                    </div>

                </div>

                <div class="member-right">

                    <span class="badge bg-success">

    <i class="bi bi-check-circle-fill"></i>

    Available

</span>

                </div>

            </div>

            `;

        }

        //--------------------------------------------------
        // ALREADY ASSIGNED
        //--------------------------------------------------

        else {

            html +=

                `
            <div
                class="member-item disabled">

                <div class="member-left">

                    <img src="${photo}">

                    <div class="member-details">

                        <h5>

                            ${member.member_name}

                        </h5>

                        <small>

                            ${member.member_code}

                        </small>

                        <small>

                            ${member.mobile}

                        </small>

                    </div>

                </div>

                <div class="member-right">

                    <span class="badge bg-danger">

    <i class="bi bi-lock-fill"></i>

    Already Assigned

</span>

                </div>

            </div>

            `;

        }

    });

    searchResults.innerHTML = html;

}
//======================================================
//          MEMBER SELECTION
//              PART - 2
//======================================================

//------------------------------------------------------
// SELECT MEMBER
//------------------------------------------------------

function selectMember(

    id,
    code,
    name,
    mobile,
    aadhaar,
    photo

) {

    memberId.value = id;

    memberName.innerText = name;

    memberCode.innerText = code;

    memberMobile.innerText = mobile || "-";

    memberAadhaar.innerText = aadhaar || "-";

    memberPhoto.src = photo;

    //--------------------------------------------------
    // ENABLE ASSIGN BUTTON
    //--------------------------------------------------

    assignButton.disabled = false;

    assignButton.innerHTML =

        `
    <i class="bi bi-check-circle-fill"></i>

    Assign Member
    `;

    //--------------------------------------------------
    // CLOSE POPUP
    //--------------------------------------------------

    if (memberModalInstance) {

        memberModalInstance.hide();

    }

    //--------------------------------------------------
    // CLEAR SEARCH
    //--------------------------------------------------

    memberSearch.value = "";

    searchResults.innerHTML =

        `
    <div class="empty-search">

        <i class="bi bi-search"></i>

        <h5>

            Start typing to search members

        </h5>

    </div>
    `;

}



//------------------------------------------------------
// IMAGE FALLBACK
//------------------------------------------------------

memberPhoto.onerror = function () {

    this.src = "/static/images/user.png";

};

document.querySelectorAll("img").forEach(img => {

    img.onerror = function () {

        this.src = "/static/images/user.png";

    };

});



//------------------------------------------------------
// RESET MODAL EVERY OPEN
//------------------------------------------------------

memberModal?.addEventListener(

    "show.bs.modal",

    () => {

        memberSearch.value = "";

        searchResults.innerHTML =

            `
        <div class="empty-search">

            <i class="bi bi-search"></i>

            <h5>

                Search Member

            </h5>

            <p>

                Type Name, Code or Mobile Number

            </p>

        </div>
        `;

    }

);



//------------------------------------------------------
// ENTER KEY SEARCH
//------------------------------------------------------

memberSearch?.addEventListener(

    "keydown",

    function (e) {

        if (e.key === "Enter") {

            e.preventDefault();

        }

    }

);



//------------------------------------------------------
// ESC KEY CLOSE
//------------------------------------------------------

memberSearch?.addEventListener(

    "keyup",

    function (e) {

        if (e.key === "Escape") {

            memberModalInstance.hide();

        }

    }

);



//------------------------------------------------------
// PREVENT MULTIPLE SUBMIT
//------------------------------------------------------

document.querySelector("form")?.addEventListener(

    "submit",

    function (e) {

        if (memberId.value === "") {

            e.preventDefault();

            alert("Please select a member.");

            return;

        }

        assignButton.disabled = true;

        assignButton.innerHTML =

            `
        <span class="spinner-border spinner-border-sm"></span>

        Assigning...
        `;

    }

);



//------------------------------------------------------
// MEMBER PROFILE ANIMATION
//------------------------------------------------------

function animateMemberCard() {

    const card = document.querySelector(".member-profile");

    if (!card) return;

    card.classList.remove("fade-up");

    void card.offsetWidth;

    card.classList.add("fade-up");

}

const originalSelectMember = selectMember;

selectMember = function (

    id,
    code,
    name,
    mobile,
    aadhaar,
    photo

) {

    originalSelectMember(

        id,
        code,
        name,
        mobile,
        aadhaar,
        photo

    );

    animateMemberCard();

};



//------------------------------------------------------
// CLEAR MEMBER
//------------------------------------------------------

function clearSelectedMember() {

    memberId.value = "";

    memberName.innerText = "No Member Selected";

    memberCode.innerText = "----";

    memberMobile.innerText = "-";

    memberAadhaar.innerText = "-";

    memberPhoto.src = "/static/images/user.png";

    assignButton.disabled = true;

    assignButton.innerHTML =

        `
    <i class="bi bi-check-circle-fill"></i>

    Select Member First
    `;

}



//------------------------------------------------------
// OPTIONAL RESET BUTTON SUPPORT
//------------------------------------------------------

document.getElementById("resetMember")?.addEventListener(

    "click",

    clearSelectedMember

);

//======================================================
//          PANDU ASSIGNMENT CENTER
//              PART - 3
//======================================================

//------------------------------------------------------
// ELEMENTS
//------------------------------------------------------

const plusBtn =
    document.getElementById("plusCount");

const minusBtn =
    document.getElementById("minusCount");

const panduCount =
    document.getElementById("panduCount");


//------------------------------------------------------
// GROUP VALUES
//------------------------------------------------------

const monthlyDueValue =
    Number(
        document.getElementById("monthlyDue")?.innerText
            .replace(/,/g, "")
    ) || 0;

const chitAmountValue =
    Number(
        document.getElementById("chitAmount")?.innerText
            .replace(/,/g, "")
    ) || 0;

const durationValue =
    Number(
        document.getElementById("durationMonths")?.innerText
    ) || 0;


//------------------------------------------------------
// PLUS BUTTON
//------------------------------------------------------

plusBtn?.addEventListener("click", () => {

    panduCount.value =
        Number(panduCount.value || 1) + 1;

    calculate();

});


//------------------------------------------------------
// MINUS BUTTON
//------------------------------------------------------

minusBtn?.addEventListener("click", () => {

    let value =
        Number(panduCount.value || 1);

    if (value > 1) {

        panduCount.value = value - 1;

        calculate();

    }

});


//------------------------------------------------------
// NUMBER CHANGE
//------------------------------------------------------

panduCount?.addEventListener(

    "input",

    calculate

);

panduCount?.addEventListener(

    "change",

    calculate

);


//------------------------------------------------------
// CALCULATE
//------------------------------------------------------

function calculate() {

    const count =

        Math.max(

            1,

            Number(panduCount.value || 1)

        );

    panduCount.value = count;

    const monthlyTotal =
        monthlyDueValue * count;

    const totalLiability =
        chitAmountValue * count;

    //--------------------------------------------------
    // SUMMARY
    //--------------------------------------------------

    document.getElementById("summaryCount").innerText =
        count;

    document.getElementById("monthlyDue").innerText =
        monthlyTotal.toLocaleString();

    document.getElementById("totalAmount").innerText =
        totalLiability.toLocaleString();

    //--------------------------------------------------
    // ANALYTICS
    //--------------------------------------------------

    document.getElementById("analyticsCount").innerText =
        count;

    document.getElementById("analyticsMonthly").innerText =
        monthlyTotal.toLocaleString();

    document.getElementById("analyticsChit").innerText =
        chitAmountValue.toLocaleString();

    document.getElementById("analyticsDuration").innerText =
        durationValue;

}


//------------------------------------------------------
// ONLY NUMBER
//------------------------------------------------------

panduCount?.addEventListener(

    "keypress",

    function (e) {

        if (

            e.key < "0" ||

            e.key > "9"

        ) {

            e.preventDefault();

        }

    }

);


//------------------------------------------------------
// TABLE SEARCH
//------------------------------------------------------

const assignmentSearch =
    document.getElementById("assignmentSearch");

assignmentSearch?.addEventListener(

    "keyup",

    function () {

        const keyword =

            this.value.toLowerCase();

        document

            .querySelectorAll(

                "#assignmentTable tr"

            )

            .forEach(row => {

                row.style.display =

                    row.innerText
                        .toLowerCase()
                        .includes(keyword)

                        ? ""

                        : "none";

            });

    }

);


//------------------------------------------------------
// AUTO SELECT TEXT
//------------------------------------------------------

panduCount?.addEventListener(

    "focus",

    function () {

        this.select();

    }

);


//------------------------------------------------------
// IMAGE FALLBACK
//------------------------------------------------------

document

    .querySelectorAll("img")

    .forEach(img => {

        img.onerror = function () {

            this.src = "/static/images/user.png";

        };

    });


//------------------------------------------------------
// PAGE INITIALIZE
//------------------------------------------------------

window.addEventListener(

    "load",

    () => {

        calculate();

    }

);


//------------------------------------------------------
// HELPER
//------------------------------------------------------

function formatCurrency(value) {

    return Number(value)

        .toLocaleString(

            "en-IN",

            {

                minimumFractionDigits: 0,

                maximumFractionDigits: 0

            }

        );

}


//------------------------------------------------------
// REFRESH SUMMARY
//------------------------------------------------------

function refreshSummary() {

    calculate();

}


//------------------------------------------------------
// DEBUG
//------------------------------------------------------

console.log(

    "Pandu Assignment Loaded Successfully."

);

