import type { Metric } from 'web-vitals';

const BOT_UA = /bot|crawler|spider/i;

function scheduleIdle(fn: () => void) {
	if (typeof window === 'undefined') return;
	if ('requestIdleCallback' in window) {
		requestIdleCallback(() => fn(), { timeout: 4000 });
	} else {
		window.setTimeout(fn, 2500);
	}
}

/** GA/CF 애널리틱스와 별도 — Core Web Vitals만 Supabase 적재용으로 전송 */
export function bootWebVitals(): void {
	if (typeof window === 'undefined') return;
	const ua = navigator.userAgent || '';
	if (BOT_UA.test(ua)) return;

	const host = window.location.hostname;
	if (host === 'localhost' || host === '127.0.0.1') return;

	scheduleIdle(() => {
		void import('web-vitals')
			.then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
				const sendVital = (metric: Metric) => {
					void fetch('/api/vitals/', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: metric.name,
							value: metric.value,
							rating: metric.rating,
							page: window.location.pathname,
						}),
						keepalive: true,
					}).catch(() => {});
				};

				onCLS(sendVital);
				onFCP(sendVital);
				onLCP(sendVital);
				onTTFB(sendVital);
				onINP(sendVital);
			})
			.catch(() => {});
	});
}
