/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { Week } from '../../types/redux/weeks';
import { baseApi } from './baseApi';

// NOTE (evan-carey): This file is a WIP, as the backend API for weeks is not yet implemented.

/**
 * This file defines the weeksApi using RTK Query.
 * It provides endpoints for fetching, adding, deleting, and editing weekly patterns.
 * The API is injected into the baseApi created in baseApi.ts.
 */
export const weeksApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getWeeks: builder.query<Week[], void>({
			query: () => 'api/weeks',
			providesTags: ['Weeks']
		}),
		addWeek: builder.mutation<void, Week>({
			query: week => ({
				url: 'api/weeks/addWeek',
				method: 'POST',
				body: week
			}),
			onQueryStarted: async (_arg, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(weeksApi.endpoints.getWeeks.initiate());
					});
			}
		}),
		deleteWeek: builder.mutation<void, Pick<Week, 'id'>>({
			query: weekId => ({
				url: 'api/weeks/delete',
				method: 'POST',
				body: weekId
			}),
			onQueryStarted: async (_, { queryFulfilled, dispatch }) => {
				queryFulfilled
					.then(() => {
						dispatch(weeksApi.endpoints.getWeeks.initiate());
					});
			}
		}),
		editWeek: builder.mutation<void, Week>({
			query: week => ({
				url: 'api/weeks/edit',
				method: 'POST',
				body: week
			}),
			onQueryStarted: async (_arg, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(weeksApi.endpoints.getWeeks.initiate());
					});
			}
		})
	})
});

export const selectWeeksQueryState = weeksApi.endpoints.getWeeks.select();
export const selectWeeks = createSelector(
	selectWeeksQueryState,
	weeksQueryState => weeksQueryState.data ?? []
);

