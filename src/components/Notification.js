
export function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'check_circle' : 'error';

    notification.className = `
    ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg shadow-gray-200 
    flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0
    pointer-events-auto min-w-[300px]
  `;

    notification.innerHTML = `
    <span class="material-symbols-outlined text-xl">${icon}</span>
    <p class="text-sm font-medium">${message}</p>
  `;

    container.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-y-10', 'opacity-0');
        notification.addEventListener('transitionend', () => {
            notification.remove();
            if (container.childNodes.length === 0) {
                container.remove();
            }
        });
    }, 3000);
}
