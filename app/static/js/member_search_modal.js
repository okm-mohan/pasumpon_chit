searchBox.addEventListener(
    "keyup",
    async function(){

        let q = this.value;

        if(q.length < 2)
            return;

        const res =
            await fetch(
                `/api/member-search?q=${q}`
            );

        const data =
            await res.json();

        renderDropdown(data);
    }
);