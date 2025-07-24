import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import { Day } from '../../types/redux/days';
import SpinnerComponent from '../SpinnerComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import DayViewComponent from './DayViewComponent';
import CreateDailyPatternModalComponent from './CreateDailyPatternModalComponent';
import { daysApi, stableEmptyDays } from '../../redux/api/daysApi';

/**
 * Defines the daily pattern info page
 * @param props defined above
 * @returns Single day element
 */
export default function DayDetailComponent() {
	const locale = useAppSelector(selectSelectedLanguage);

	// Day state
	const { data: dayState = stableEmptyDays, isFetching: dayFetching } = daysApi.useGetDailyPatternsQuery();

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipDayView: 'help.admin.dailypatternview'
	};

	return (
		<div className='flexGrowOne'>
			{dayFetching ? (
				<div className='text-center'>
					<SpinnerComponent loading width={50} height={50} />
					<FormattedMessage id='redo.cik.and.refresh.db.views' />
				</div>
			) : (
				<div>
					<TooltipHelpComponent page='daily.patterns' />

					<div className='container-fluid'>
						<h2 style={titleStyle}>
							<FormattedMessage id='daily.patterns' />
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='daily.patterns' helpTextId={tooltipStyle.tooltipDayView} />
							</div>
						</h2>
						<div className="edit-btn">
							{/* Placeholder for create day modal */}
							<CreateDailyPatternModalComponent />
						</div>
						<div className="card-container">
							{Object.values(dayState)
								.sort((a: Day, b: Day) => (a.dayName || '').toLowerCase().localeCompare((b.dayName || '').toLowerCase(), locale, { sensitivity: 'accent' }))
								.map(day => (
									<DayViewComponent key={day.id} day={day} />
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
