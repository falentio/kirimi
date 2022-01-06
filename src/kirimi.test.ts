import { Kirimi, KirimiError } from "./kirimi.ts";
import {
	assertEquals,
	assertRejects,
} from "https://deno.land/std@0.119.0/testing/asserts.ts";

Deno.test("timeout error should be thrown", async () => {
	await assertRejects(
		async () => {
			const kirimi = new Kirimi();
			await kirimi.get("https://httpbin.org/", { timeout: 1 });
		},
		KirimiError,
		"request timed out",
	);
});

Deno.test("searchParams priority should from url to default then kirimiInit and ignoring from baseUrl", async () => {
	const kirimi = new Kirimi({
		baseUrl: "https://httpbin.org/?lorem=ipsum",
		searchParams: {
			bar: "2",
			baz: "2",
		},
	});
	const response = await kirimi.get("get?foo=1&bar=1&baz=1", {
		searchParams: {
			baz: "3",
		},
	});
	const json = await response.json();
	assertEquals(json.args, { foo: "1", bar: "2", baz: "3" });
});

Deno.test("headers priority should from default then kirimiInit", async () => {
	const kirimi = new Kirimi({
		baseUrl: "https://httpbin.org/",
		headers: {
			foo: "1",
			bar: "1",
		},
	});
	const response = await kirimi.get("get", {
		headers: {
			bar: "2",
		},
	});
	const json = await response.json();
	assertEquals(json.headers.Foo, "1");
	assertEquals(json.headers.Bar, "2");
});

Deno.test("body shouldn't replaced with json", async () => {
	const kirimi = new Kirimi({
		baseUrl: "https://httpbin.org/",
	});
	const response = await kirimi.post("post", {
		body: "foo",
		json: { "foo": "bar" },
	});
	const json = await response.json();
	assertEquals(json.json, null);
	assertEquals(json.data, "foo");
});

Deno.test("json should set 'content-type' headers to 'application/json'", async () => {
	const kirimi = new Kirimi({
		baseUrl: "https://httpbin.org/",
	});
	const response = await kirimi.post("post", {
		json: { "foo": "bar" },
	});
	const json = await response.json();
	assertEquals(json.headers["Content-Type"], "application/json");
});

Deno.test("signal shouldn't replaced with timeout", async () => {
	const kirimi = new Kirimi({
		baseUrl: "https://httpbin.org/",
	});
	const { signal } = new AbortController();
	const response = await kirimi.get("get", {
		signal,
		timeout: 1,
	});
	await response.text();
});
