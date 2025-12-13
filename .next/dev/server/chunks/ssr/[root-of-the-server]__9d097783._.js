module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/app/records/smart-entry/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SmartEntryForm } from "@/components/smart-entry-form";
export default async function SmartEntryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }
    // Fetch staff
    const { data: staff = [] } = await supabase.from("staff").select("*");
    return /*#__PURE__*/ _jsxDEV(SmartEntryForm, {
        staff: staff
    }, void 0, false, {
        fileName: "[project]/app/records/smart-entry/page.tsx",
        lineNumber: 18,
        columnNumber: 10
    }, this);
}
}),
"[project]/app/records/smart-entry/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/records/smart-entry/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__9d097783._.js.map