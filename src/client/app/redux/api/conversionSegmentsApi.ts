/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { baseApi } from './baseApi';
import { ConversionSegmentData } from '../../types/redux/conversionSegments';

/**
 * This file defines the segmentsApi using RTK Query.
 * It provides endpoints for fetching, adding, deleting, and editing conversion segments.
 * The API is injected into the baseApi created in baseApi.ts.
 */
export const conversionSegmentsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getConversionSegments: builder.query<ConversionSegmentData[], void>({
			query: () => '/api/conversionSegments',
			providesTags: ['ConversionSegments']
		}),
		getConversionSegmentByConversion: builder.query<ConversionSegmentData[], {sourceId: number; destinationId: number }>({
			query: ({ sourceId, destinationId }) => ({
				url: '/api/conversionSegments/segments',
				method: 'POST',
				body: { sourceId, destinationId }
			}),
			providesTags: (result, error, segment) => [
				{ type: 'ConversionSegments', id: 'LIST' },
				{ type: 'ConversionSegments', id: `${segment.sourceId}-${segment.destinationId}` }
			]
		}),
		getConversionSegmentByKey: builder.query<ConversionSegmentData, { sourceId: number; destinationId: number; startTime: string; endTime: string }>({
			query: ({ sourceId, destinationId, startTime, endTime }) => ({
				url: '/api/conversionSegments/segment',
				method: 'POST',
				body: { sourceId, destinationId, startTime, endTime }
			}),
			providesTags: (result, error, segment) => [{
				type: 'ConversionSegments',
				id: `${segment.sourceId}-${segment.destinationId}-${segment.startTime}-${segment.endTime}`
			}]
		}),
		editConversionSegment: builder.mutation<void, { segment: ConversionSegmentData; originalStartTime: string; originalEndTime: string; }>({
			query: ({ segment, originalStartTime, originalEndTime }) => ({
				url: '/api/conversionSegments/edit',
				method: 'POST',
				body: {
					...segment,
					originalStartTime,
					originalEndTime
				}
			}),
			invalidatesTags: (result, error, { segment }) => [
				{ type: 'ConversionSegments', id: 'LIST' },
				{ type: 'ConversionSegments', id: `${segment.sourceId}-${segment.destinationId}` }
			]
		}),
		addConversionSegment: builder.mutation<void, ConversionSegmentData>({
			query: segment => ({
				url: '/api/conversionSegments/add',
				method: 'POST',
				body: segment
			}),
			invalidatesTags: (result, error, segment) => [
				{ type: 'ConversionSegments', id: 'LIST' },
				{ type: 'ConversionSegments', id: `${segment.sourceId}-${segment.destinationId}` }
			]
		}),
		deleteConversionSegment: builder.mutation<void,{ sourceId: number; destinationId: number; startTime: string, endTime: string; }>({
			query: payload => ({
				url: '/api/conversionSegments/delete',
				method: 'POST',
				body: payload
			}),
			invalidatesTags: (result, error, segment) => [
				{ type: 'ConversionSegments', id: 'LIST' },
				{ type: 'ConversionSegments', id: `${segment.sourceId}-${segment.destinationId}` }
			]
		})
	})
});

export const {
	useGetConversionSegmentsQuery,
	useGetConversionSegmentByConversionQuery,
	useGetConversionSegmentByKeyQuery,
	useEditConversionSegmentMutation,
	useAddConversionSegmentMutation,
	useDeleteConversionSegmentMutation
} = conversionSegmentsApi;
