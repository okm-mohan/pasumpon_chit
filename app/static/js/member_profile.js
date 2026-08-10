document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById('profilePhotoPreview');
  [document.getElementById('profilePhotoFile'), document.getElementById('profilePhotoCamera')].forEach(input => {
    input?.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file && preview) preview.src = URL.createObjectURL(file);
    });
  });
});
