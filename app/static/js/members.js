// ================================
// PHOTO PREVIEW
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const photoInput = document.getElementById("photo");
    const preview = document.getElementById("preview");

    if (photoInput) {

        photoInput.addEventListener("change", function () {

            const file = this.files[0];

            if (file) {

                const reader = new FileReader();

                reader.onload = function (e) {
                    preview.src = e.target.result;
                };

                reader.readAsDataURL(file);
            }

        });

    }

});


// ================================
// SAME MOBILE -> WHATSAPP
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const checkbox = document.getElementById("sameMobile");

    if (checkbox) {

        checkbox.addEventListener("change", function () {

            const mobile =
                document.getElementById("mobile").value;

            const whatsapp =
                document.getElementById("whatsapp");

            if (this.checked) {

                whatsapp.value = mobile;

            } else {

                whatsapp.value = "";

            }

        });

    }

});


// ================================
// PANDU SHOW / HIDE
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const panduCheck =
        document.getElementById("is_pandu");

    const panduSection =
        document.getElementById("panduSection");

    if (panduSection) {

        panduSection.style.display = "none";

    }

    if (panduCheck) {

        panduCheck.addEventListener("change", function () {

            if (this.checked) {

                panduSection.style.display = "block";

            } else {

                panduSection.style.display = "none";

            }

        });

    }

});


// ================================
// BASIC VALIDATION
// ================================

document.addEventListener("DOMContentLoaded", function () {

    const form =
        document.getElementById("memberForm");

    if (!form) return;

    form.addEventListener("submit", function (e) {

        const name =
            document.querySelector(
                'input[name="member_name"]'
            ).value.trim();

        const mobile =
            document.querySelector(
                'input[name="mobile"]'
            ).value.trim();

        const aadhaar =
            document.querySelector(
                'input[name="aadhaar_no"]'
            ).value.trim();

        if (name === "") {

            alert("Member Name Required");

            e.preventDefault();

            return;

        }

        if (mobile.length < 10) {

            alert("Enter Valid Mobile Number");

            e.preventDefault();

            return;

        }

        if (
            aadhaar !== "" &&
            aadhaar.length !== 12
        ) {

            alert(
                "Aadhaar must be 12 digits"
            );

            e.preventDefault();

            return;

        }

    });

});