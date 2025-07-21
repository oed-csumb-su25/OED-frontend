/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
DELETE FROM conversion_segments
WHERE source_id = ${source} AND destination_id = ${destination} AND start_time = ${startTime};