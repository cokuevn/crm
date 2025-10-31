import React from 'react';

const VARIANTS = {
  success: {
    accent: 'bg-emerald-500 text-white',
    border: 'border border-emerald-200/80',
    glow: 'shadow-[0_18px_45px_-15px_rgba(16,185,129,0.4)]',
    badgeText: 'text-emerald-500',
    title: 'text-gray-900',
    message: 'text-gray-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  error: {
    accent: 'bg-rose-500 text-white',
    border: 'border border-rose-200/80',
    glow: 'shadow-[0_18px_45px_-15px_rgba(244,63,94,0.45)]',
    badgeText: 'text-rose-500',
    title: 'text-gray-900',
    message: 'text-gray-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  },
  warning: {
    accent: 'bg-amber-500 text-white',
    border: 'border border-amber-200/80',
    glow: 'shadow-[0_18px_45px_-15px_rgba(245,158,11,0.45)]',
    badgeText: 'text-amber-500',
    title: 'text-gray-900',
    message: 'text-gray-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.08 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  },
  info: {
    accent: 'bg-sky-500 text-white',
    border: 'border border-sky-200/80',
    glow: 'shadow-[0_18px_45px_-15px_rgba(14,165,233,0.4)]',
    badgeText: 'text-sky-500',
    title: 'text-gray-900',
    message: 'text-gray-600',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
      </svg>
    )
  }
};

export default function NotificationToast({ notifications, onClose }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      {notifications.map((notification, index) => {
        const variant = VARIANTS[notification.type] || VARIANTS.info;

        return (
          <div
            key={index}
            className={`max-w-md w-[360px] md:w-[380px] rounded-2xl bg-white/95 backdrop-blur-md ${variant.border} ${variant.glow} pointer-events-auto transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:shadow-2xl`}
          >
            <div className="relative flex items-center gap-4 px-5 py-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${variant.accent} shadow-inner shadow-black/10`}>{variant.icon}</div>

              <div className="flex-1 min-w-0">
                {notification.title ? (
                  <p className={`text-sm font-semibold tracking-[0.01em] ${variant.title}`}>{notification.title}</p>
                ) : null}
                {notification.message ? (
                  <p className={`mt-1 text-sm leading-5 ${variant.message}`}>{notification.message}</p>
                ) : null}
              </div>

              <button
                onClick={() => onClose(index)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

