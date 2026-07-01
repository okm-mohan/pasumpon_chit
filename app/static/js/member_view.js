// ======================================================
// MEMBER VIEW - PREMIUM ERP
// member_view.js
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Member View Loaded");

    // ==========================================
    // Animate cards on page load
    // ==========================================

    const cards = document.querySelectorAll(
        ".profile-card, .info-card, .stat-box"
    );

    cards.forEach((card, index) => {

        card.style.opacity = "0";
        card.style.transform = "translateY(25px)";

        setTimeout(() => {

            card.style.transition =
                "all 0.5s ease";

            card.style.opacity = "1";
            card.style.transform =
                "translateY(0px)";

        }, index * 120);

    });


    // ==========================================
    // Button Ripple Effect
    // ==========================================

    document.querySelectorAll(".btn-custom").forEach(btn => {

        btn.addEventListener("click", function () {

            this.classList.add("clicked");

            setTimeout(() => {

                this.classList.remove("clicked");

            }, 250);

        });

    });


    // ==========================================
    // Profile Image Hover
    // ==========================================

    const profile = document.querySelector(".profile-image");

    if(profile){

        profile.addEventListener("mouseenter", function(){

            this.style.transform = "scale(1.08)";
            this.style.transition = ".3s";

        });

        profile.addEventListener("mouseleave", function(){

            this.style.transform = "scale(1)";

        });

    }


    // ==========================================
    // Print Button
    // ==========================================

    const printBtn = document.querySelector(".btn-primary");

    if(printBtn){

        printBtn.addEventListener("click", function(){

            window.print();

        });

    }

});