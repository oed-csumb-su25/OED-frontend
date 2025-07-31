/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, FormFeedback, Input, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { DaySegment } from '../../types/redux/days';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';

/**
 * Convert an integer [0, 24] to standard time value format to be used by the time input.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time#time_value_format
 * @param hour The integer hour to convert
 * @returns a time string in the format "HH:mm"
 */
// function hourToTimeFormat(hour: number) {
// 	const clamped = Math.max(0, Math.min(24, hour));
// 	const hh = clamped.toString().padStart(2, '0');
// 	return `${hh}:00`;
// }

/**
 * Converts a time string in the format "HH:mm" to an integer hour.
 * @param timeStr The time string to convert (e.g., "09:00")
 * @returns The integer hour (e.g., 9)
 */
// function timeFormatToHour(timeStr: string): number {
// 	const [hh] = timeStr.split(':').map(Number);
// 	// Only supports full hours (mm === 0)
// 	return hh;
// }

interface SplitDaySegmentComponentProps {
	direction: 'earlier' | 'later';
	daySegment: DaySegment;
}

export default function SplitDaySegmentComponent(props: SplitDaySegmentComponentProps): React.ReactElement {

	// const [daySegment, setDaySegment] = React.useState({ ...props.daySegment });

	const [splitHour, setSplitHour] = React.useState<number>(props.daySegment.startHour + 1);

	const [showEditModal, setShowEditModal] = React.useState(false);

	const [editDaySegmentMutation, { isLoading: isEditSaving }] = daySegmentsApi.useEditDailyPatternSegmentMutation();

	const [addDaySegmentMutation, { isLoading: isAddSaving }] = daySegmentsApi.useAddDailyPatternSegmentMutation();

	const handleShowEditModal = () => setShowEditModal(true);
	const handleHideEditModal = () => setShowEditModal(false);

	const handleSplitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSplitHour(Number(e.target.value));
	};

	const isSplitValid = React.useMemo(() => {
		if (!Number.isInteger(splitHour)) {
			return false;
		}
		return splitHour > props.daySegment.startHour && splitHour < props.daySegment.endHour;

	}, [splitHour, props.daySegment, props.direction]);

	const handleSplitSegment = () => {
		if (!isSplitValid) {
			return;
		}

		const editSegment: DaySegment = {
			...props.daySegment,
			startHour: props.direction === 'earlier' ? splitHour : props.daySegment.startHour,
			endHour: props.direction === 'earlier' ? props.daySegment.endHour : splitHour
		};
		const newSegment: Omit<DaySegment, 'id'> = {
			dayId: props.daySegment.dayId,
			slope: 0,
			intercept: 0,
			startHour: props.direction === 'earlier' ? props.daySegment.startHour : splitHour,
			endHour: props.direction === 'earlier' ? splitHour : props.daySegment.endHour
		};

		const editPromise = editDaySegmentMutation(editSegment).unwrap();
		const addPromise = addDaySegmentMutation(newSegment).unwrap();

		Promise.all([editPromise, addPromise])
			.then(() => {
				handleHideEditModal();
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	return (
		<>
			<Button size="sm" onClick={handleShowEditModal}>
				<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
			</Button>

			<Modal isOpen={showEditModal} toggle={handleHideEditModal} backdrop="static" >
				<ModalHeader>
					<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
				</ModalHeader>
				<ModalBody>
					{/* TODO: internationalize */}
					<p>Enter the hour to split the segment</p>
					<Input
						id="split"
						type="number"
						min={props.daySegment.startHour + 1}
						max={props.daySegment.endHour - 1}
						step="1"
						onChange={handleSplitInputChange}
						placeholder={props.daySegment.startHour + 1 + ' - ' + (props.daySegment.endHour - 1)}
						invalid={!isSplitValid}
					/>
					<FormFeedback>
						{/* TODO: internationalize */}
						{!isSplitValid && 'Please enter a valid hour between ' + (props.daySegment.startHour + 1) + translate('and') + (props.daySegment.endHour - 1)}
					</FormFeedback>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={handleHideEditModal}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button
						color="primary"
						onClick={handleSplitSegment}
						disabled={!isSplitValid || isEditSaving || isAddSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

