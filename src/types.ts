interface KirimiInit extends RequestInit {
	timeout?: number;
	passRequestInError?: boolean;
	passResponseInError?: boolean;
	statusCodeValidator?: (code: number) => boolean;
	baseUrl?: string | URL;
	searchParams?:
		| Record<string, string>
		| URLSearchParams
		| string
		| string[][];
	method?:
		| "GET"
		| "HEAD"
		| "OPTIONS"
		| "PATCH"
		| "POST"
		| "PUT";
	/**
	 * 	Must be seriazable with JSON.stringify
	 * 	it also set "content-type" headers to "application/json"
	 * 	if you provide body and json. then json will ignored
	 */
	json?: Json;
}

type Json =
	| Record<string, JsonValue>
	| JsonValue[]
	| JsonValue;

type JsonValue =
	| string
	| null
	| number
	| boolean;

type KirimiOptions = Omit<KirimiInit, "json" | "body" | "signal">;

export type { Json, JsonValue, KirimiInit, KirimiOptions };
