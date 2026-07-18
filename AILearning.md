# AI Learning Log

## Lesson 1: CameraView Layout on Android
- **Mistake**: Used `<View style={{flex:1, justifyContent:'space-between'}}>` as a wrapper inside `CameraView` — this renders correctly in the Expo dev client but collapses to 0×0 in production Android APKs
- **Correction**: Must use the same pattern as the working `GuardScanScreen.js` — each overlay element as a direct child of CameraView with independent absolute positioning
- **Rule for future**: Never wrap CameraView children in a flex container. Always check working screens in the same project first and copy their exact pattern.

## Lesson 2: `alignSelf: 'center'` with `position: 'absolute'` on Android
- **Mistake**: Used `alignSelf: 'center'` on an absolutely positioned element to center it horizontally
- **Correction**: On Android, `alignSelf` is ignored for absolute elements. Must use `left: 0, right: 0` on the container and `alignItems: 'center'` to center content
- **Rule for future**: Never use `alignSelf` with `position: 'absolute'` on Android

## Lesson 3: CameraView style `absoluteFillObject` vs `flex: 1`
- **Mistake**: Used `style={StyleSheet.absoluteFillObject}` on CameraView
- **Correction**: The working GuardScanScreen uses `style={{ flex: 1 }}` — absoluteFillObject removes CameraView from the flex layout chain, causing its children to lose layout context
- **Rule for future**: CameraView should use `flex: 1`, not `absoluteFillObject`

## Lesson 4: Multi-Tenant and Role-based Queries
- **Mistake**: Filtered `face_embeddings` by `students.user_id == caller_id` in `/identify`. This worked for Admin (who owns students) but failed for Guards (who belong to the same college but have their own user_id).
- **Correction**: Query the caller's college, look up all users belonging to that college, and query students matching any of those user_ids.
- **Rule for future**: Keep tenant isolation (college) in mind. Guards and Admins belong to the same college.

## Lesson 5: Base64 data URI storage for profile photos
- **Decision**: Stored base64-encoded image string directly into Supabase student table `photo_url` column to save storage bucket configuration.
- **Benefit**: Simplifies configuration and allows standard `<Image>` components to render the base64 string directly on both iOS and Android.

## Lesson 6: FlatList rendering crash with nested response objects
- **Mistake**: Passed the response wrapper object `res.data` directly to a FlatList instead of accessing the nested array key `res.data.students`.
- **Correction**: Access the specific array key returning the list values (`res.data.students`).
- **Rule for future**: Check backend endpoint responses explicitly before wiring them to FlatList data properties.

## Lesson 7: Database Column Mismatches
- **Mistake**: Accessing `item.full_name` in React Native screens while the database table column was named `name`.
- **Correction**: Verify database schema definitions and map React Native properties to match exact database columns.
- **Rule for future**: Check backend schema definitions before assuming user model property names.

## Lesson 8: Axios Catch Block Error Masking
- **Mistake**: Using a generic fallback string (e.g., `"Failed to connect to biometric service"`) when parsing `err.response?.data?.detail` in Axios catch blocks. This masks backend validations (like a 400 Bad Request indicating no face was detected).
- **Correction**: Explicitly verify if a response was received from the server (`err.response`) first, then parse the response body dynamically and map specific status codes/reasons to human-readable text before falling back to network errors.
- **Rule for future**: Never let generic connection error messages mask semantic validation errors returned by the API server.

## Lesson 9: Navigation Backstack and `.replace()` calls
- **Mistake**: Calling `navigation.goBack()` in a screen (like `FaceEnrollmentScreen`) that was opened using `navigation.replace()`. When `.replace()` is used, the previous screen is popped off the stack, which can leave the navigation backstack empty, causing `goBack()` to fail or do nothing.
- **Correction**: Check `navigation.canGoBack()` before calling `navigation.goBack()`. If it returns false, fall back to navigation to a root dashboard (e.g., `.replace('AdminDashboard')`).
- **Rule for future**: Always handle the case where `navigation.goBack()` might fail due to screen replacements or deep links.

## Lesson 10: Storing large blobs in database columns causes cascading gateway timeouts
- **Mistake**: The `/enroll` endpoint stored the full base64 image (~1-3 MB) as `photo_url` on the first enrollment call, then re-fetched it on every subsequent call via `SELECT("id", "photo_url")`. This caused localtunnel to timeout with a 502 on Step 2+ because the Supabase response payload was enormous.
- **Correction**: Only `SELECT` lightweight columns (`id, is_enrolled`). Use the `is_enrolled` flag to determine if this is the first call. Never fetch BLOB/TEXT columns unless you specifically need their content.
- **Rule for future**: When storing large data (base64 images, files) in a database column, always ensure that `SELECT` queries on that table do NOT include that column by default. Use targeted column lists, not `SELECT *` or lazy includes.

- **Rule for future**: When sending images through tunnels/proxies with timeout limits, always minimize payload size. For AI feature extraction, lower resolutions often produce identical results.

## Lesson 12: Bypassing IDE Sandbox Proxy Limits during DB Seeding/Network Calls
- **Mistake**: Attempting to run network-bound database scripts (like checking schema or seeding) directly inside the sandboxed agent terminal without bypassing proxy variables. The IDE proxy blocks connections to database domains or forces DNS resolution to go through a loopback resolver, resulting in `httpx.ProxyError: 403 Forbidden` or `ConnectError: Errno 8`.
- **Correction**: Realize that the user's local terminal runs outside the sandbox process tree and has normal network access. Place the script inside the workspace and instruct the user to run it locally in their terminal, or request the `unsandboxed` action permission and clear local proxy environment variables if direct execution is required.
- **Rule for future**: For heavy network tasks (such as seeding 1,000 records or executing third-party integrations), write the code as a local project script or API endpoint, and guide the user to execute it directly in their native environment to bypass sandbox/proxy limitations.


