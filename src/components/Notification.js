

export function showNotification(message, type = 'success', action = null, duration = 3000) {
    let container = document.getElementById('notification-container');
    const containerClass = 'fixed bottom-4 left-0 right-0 z-50 flex flex-col gap-2 pointer-events-none items-center px-4 sm:px-0';

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    // Always update class to ensure responsiveness
    container.className = containerClass;

    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500 dark:bg-green-600' : type === 'error' ? 'bg-red-500 dark:bg-red-600' : 'bg-gray-800 dark:bg-gray-700';
    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    notification.className = `
    ${bgColor} text-white px-4 py-2.5 rounded-xl shadow-lg shadow-gray-200 dark:shadow-gray-900/50
    flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0
    pointer-events-auto w-full max-w-md
  `;

    let actionHtml = '';
    if (action) {
        actionHtml = `
        <button type="button" class="ml-auto bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
            ${action.label}
        </button>
        `;
    }

    notification.innerHTML = `
    <span class="material-symbols-outlined text-xl">${icon}</span>
    <p class="text-sm font-medium flex-grow">${message}</p>
    ${actionHtml}
  `;

    container.appendChild(notification);

    if (action) {
        const btn = notification.querySelector('button');
        btn.addEventListener('click', () => {
            action.callback();
            removeNotification(notification, container);
        });
    }

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.remove('translate-y-10', 'opacity-0');
    });

    // Remove after duration (if not persistent)
    if (duration > 0) {
        setTimeout(() => {
            removeNotification(notification, container);
        }, duration);
    }
}

function removeNotification(notification, container) {
    notification.classList.add('translate-y-10', 'opacity-0');
    notification.addEventListener('transitionend', () => {
        notification.remove();
        if (container.childNodes.length === 0) {
            container.remove();
        }
    });
}

