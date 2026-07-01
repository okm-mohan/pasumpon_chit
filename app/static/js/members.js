// ======================================================
// MEMBERS PAGE
// Premium UI JavaScript
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    // ============================================
    // ELEMENTS
    // ============================================

    const form = document.getElementById("memberForm");

    const memberName = document.getElementById("member_name");
    const mobile = document.getElementById("mobile");
    const whatsapp = document.getElementById("whatsapp");
    const aadhaar = document.getElementById("aadhaar_no");
    const address = document.getElementById("address");

    const previewName = document.getElementById("previewName");
    const previewMobile = document.getElementById("previewMobile");
    const previewWhatsapp = document.getElementById("previewWhatsapp");
    const previewAddress = document.getElementById("previewAddress");

    const photo = document.getElementById("photo");
    const preview = document.getElementById("preview");

    const sameMobile = document.getElementById("sameMobile");

    // ============================================
    // PHOTO PREVIEW
    // ============================================

    if (photo) {

        photo.addEventListener("change", function () {

            if (!this.files.length) return;

            const reader = new FileReader();

            reader.onload = function (e) {

                preview.src = e.target.result;

            };

            reader.readAsDataURL(this.files[0]);

        });

    }

    // ============================================
    // LIVE MEMBER NAME
    // ============================================

    if (memberName) {

        memberName.addEventListener("input", function () {

            const value = this.value.trim();

            previewName.textContent =
                value === "" ? "Member Name" : value;

        });

    }

    // ============================================
    // LIVE MOBILE
    // ============================================

    if (mobile) {

        mobile.addEventListener("input", function () {

            this.value = this.value.replace(/\D/g, "");

            previewMobile.textContent =
                this.value || "----------";

            if (sameMobile.checked) {

                whatsapp.value = this.value;

                previewWhatsapp.textContent =
                    this.value || "----------";

            }

        });

    }

    // ============================================
    // LIVE WHATSAPP
    // ============================================

    if (whatsapp) {

        whatsapp.addEventListener("input", function () {

            this.value = this.value.replace(/\D/g, "");

            previewWhatsapp.textContent =
                this.value || "----------";

        });

    }

    // ============================================
    // SAME AS MOBILE
    // ============================================

    if (sameMobile) {

        sameMobile.addEventListener("change", function () {

            if (this.checked) {

                whatsapp.value = mobile.value;

                previewWhatsapp.textContent =
                    mobile.value || "----------";

            } else {

                whatsapp.value = "";

                previewWhatsapp.textContent =
                    "----------";

            }

        });

    }

    // ============================================
    // ADDRESS PREVIEW
    // ============================================

    if (address) {

        address.addEventListener("input", function () {

            const value = this.value.trim();

            previewAddress.textContent =
                value === "" ? "Not Entered" : value;

        });

    }

    // ============================================
    // AADHAAR ONLY NUMBERS
    // ============================================

    if (aadhaar) {

        aadhaar.addEventListener("input", function () {

            this.value =
                this.value.replace(/\D/g, "").slice(0, 12);

        });

    }

    // ============================================
    // MOBILE ONLY NUMBERS
    // ============================================

    if (mobile) {

        mobile.addEventListener("keypress", function (e) {

            if (!/[0-9]/.test(e.key)) {

                e.preventDefault();

            }

        });

    }

    if (whatsapp) {

        whatsapp.addEventListener("keypress", function (e) {

            if (!/[0-9]/.test(e.key)) {

                e.preventDefault();

            }

        });

    }

    // ============================================
    // FORM VALIDATION
    // ============================================

    if (form) {

        form.addEventListener("submit", function (e) {

            if (memberName.value.trim() === "") {

                alert("Please Enter Member Name");

                memberName.focus();

                e.preventDefault();

                return;

            }

            if (mobile.value.trim().length !== 10) {

                alert("Mobile Number must be 10 digits");

                mobile.focus();

                e.preventDefault();

                return;

            }

            if (
                whatsapp.value !== "" &&
                whatsapp.value.length !== 10
            ) {

                alert("WhatsApp Number must be 10 digits");

                whatsapp.focus();

                e.preventDefault();

                return;

            }

            if (
                aadhaar.value !== "" &&
                aadhaar.value.length !== 12
            ) {

                alert("Aadhaar Number must be 12 digits");

                aadhaar.focus();

                e.preventDefault();

                return;

            }

        });

    }

    // ============================================
    // RESET PREVIEW
    // ============================================

    form.addEventListener("reset", function () {

        setTimeout(function () {

            preview.src = "/static/images/user.png";

            previewName.textContent = "Member Name";

            previewMobile.textContent = "----------";

            previewWhatsapp.textContent = "----------";

            previewAddress.textContent = "Not Entered";

        }, 100);

    });

});