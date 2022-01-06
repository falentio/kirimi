import type { KirimiInit, KirimiOptions } from "./types.ts";

export class KirimiError extends Error {
	request?: Request;
	response?: Response;
	error: Error;
	kirimiInit?: KirimiInit;
	constructor(e: Error) {
		super(e.message);
		this.error = e;
	}
}

export class Kirimi {
	constructor(
		public opts: KirimiOptions = <KirimiOptions> {},
	) {
		this.opts = Object.assign(
			{},
			<KirimiOptions> {
				headers: {},
				searchParams: {},
				timeout: 0,
				passResponseInError: true,
				passRequestInError: true,
				statusCodeValidator(code) {
					if (code < 200) {
						return false;
					}
					if (code >= 400) {
						return false;
					}
					return true;
				},
			},
			this.opts,
		);
	}

	extends(opts: KirimiOptions): Kirimi {
		const o = Object.assign(
			{},
			this.opts,
			opts,
		);
		o.headers = new Headers(o.headers);
		o.searchParams = new URLSearchParams(o.searchParams);
		return new Kirimi(o);
	}

	async fetch(url: string | URL, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit = Object.assign(
			{},
			this.opts,
			<KirimiInit> {
				headers: {},
				searchParams: {},
			},
			kirimiInit,
		);
		url = new URL(url.toString(), kirimiInit.baseUrl);
		kirimiInit.headers = new Headers(kirimiInit.headers);
		for (const [k, v] of new Headers(this.opts.headers)) {
			if (kirimiInit.headers.has(k)) {
				continue;
			}
			kirimiInit.headers.set(k, v);
		}
		kirimiInit.searchParams = new URLSearchParams([
			...new URLSearchParams(this.opts.searchParams),
			...new URLSearchParams(kirimiInit.searchParams),
		]);
		// https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value
		if (kirimiInit.timeout && kirimiInit.timeout >= 2 ** 32) {
			// deno-fmt-ignore
			throw new TypeError("cant use " + kirimiInit.timeout + " as timeout, max value for setTimeout is 32bit integer")
		}

		let timeout;
		let request;
		let response;
		try {
			const controller = new AbortController();
			if (!kirimiInit.signal && kirimiInit.timeout) {
				kirimiInit.signal = controller.signal;
				timeout = setTimeout(() => {
					controller.abort(new Error("request timed out"));
				}, kirimiInit.timeout);
			}
			for (const [k, v] of kirimiInit.searchParams) {
				url.searchParams.set(k, v);
			}
			if (!kirimiInit.body && kirimiInit.json) {
				kirimiInit.body = JSON.stringify(kirimiInit.json);
				kirimiInit.headers.set("content-type", "application/json");
			}
			request = new Request(url.toString(), kirimiInit);
			response = await fetch(request);
			const valid = kirimiInit
				.statusCodeValidator?.(response.status) ?? true;
			if (!valid) {
				throw new Error("request responsed with " + response.status);
			}
			clearTimeout(timeout);
			return response;
		} catch (e) {
			clearTimeout(timeout);
			if (e instanceof Error) {
				const error = new KirimiError(e);
				error.kirimiInit = kirimiInit;
				if (kirimiInit.passResponseInError) {
					error.response = response;
				}
				if (kirimiInit.passRequestInError) {
					error.request = request;
				}
				throw error;
			}
			throw e;
		}
	}

	get(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "GET";
		return this.fetch(url, kirimiInit);
	}

	head(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "HEAD";
		return this.fetch(url, kirimiInit);
	}

	options(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "OPTIONS";
		return this.fetch(url, kirimiInit);
	}

	patch(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "PATCH";
		return this.fetch(url, kirimiInit);
	}

	post(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "POST";
		return this.fetch(url, kirimiInit);
	}

	put(url: URL | string, kirimiInit: KirimiInit): Promise<Response> {
		kirimiInit.method = "PUT";
		return this.fetch(url, kirimiInit);
	}
}
