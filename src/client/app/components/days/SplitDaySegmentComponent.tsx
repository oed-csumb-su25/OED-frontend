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

interface SplitDaySegmentComponentProps {
	/**
	 * The direction to split the segment
	 */
	direction: 'earlier' | 'later';

	/**
	 * The day segment to split
	 */
	daySegment: DaySegment;
}

/**
 * Defines a button that opens a modal to split a day segment into two segments.
 * The split can be done earlier or later based on the direction prop.
 * @param props The properties for the component
 * @returns A button element
 */
export default function SplitDaySegmentComponent(props: SplitDaySegmentComponentProps): React.ReactElement {

	const [splitHour, setSplitHour] = React.useState<number>(props.daySegment.startHour + 1);

	const [showSplitModal, setShowSplitModal] = React.useState(false);

	const [deleteDaySegmentMutation, { isLoading: isDeleting }] = daySegmentsApi.useDeleteDailyPatternSegmentMutation();

	const [addDaySegmentMutation, { isLoading: isAddSaving }] = daySegmentsApi.useAddDailyPatternSegmentMutation();

	const handleShowSplitModal = () => setShowSplitModal(true);
	const handleHideSplitModal = () => setShowSplitModal(false);

	const handleSplitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSplitHour(Number(e.target.value));
	};

	// Validate the split hour
	// It should be greater than the start hour and less than the end hour
	const isSplitValid = React.useMemo(() => {
		if (!Number.isInteger(splitHour)) {
			return false;
		}
		return splitHour > props.daySegment.startHour && splitHour < props.daySegment.endHour;

	}, [splitHour, props.daySegment, props.direction]);

	// Handle the split operation
	// It deletes the original segment and creates two new segments based on the split hour
	const handleSubmit = () => {
		if (!isSplitValid) {
			return;
		}

		// New segment based on the original segment
		// It copies the slope and intercept from the original segment
		// and sets the start and end hours based on the split hour
		// The original segment is deleted after the new segments are created
		const copySegment: Omit<DaySegment, 'id'> = {
			dayId: props.daySegment.dayId,
			slope: props.daySegment.slope,
			intercept: props.daySegment.intercept,
			note: props.daySegment.note,
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

		const deleteOriginalSegment = deleteDaySegmentMutation({ id: props.daySegment.id }).unwrap();

		const createCopySegment = addDaySegmentMutation(copySegment).unwrap();
		const createNewSegment = addDaySegmentMutation(newSegment).unwrap();

		deleteOriginalSegment
			.then(() =>
				Promise.all([createCopySegment, createNewSegment]))
			.then(() => {
				handleHideSplitModal();
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	return (
		<>
			<Button size="sm" onClick={handleShowSplitModal}>
				<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
			</Button>

			<Modal isOpen={showSplitModal} toggle={handleHideSplitModal} backdrop="static" >
				<ModalHeader>
					<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
				</ModalHeader>
				<ModalBody>
					<p><FormattedMessage id="split.hour.prompt" /></p>
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
						{!isSplitValid && translate('split.hour.invalid')
  							.replace('{start}', String(props.daySegment.startHour + 1))
  							.replace('{end}', String(props.daySegment.endHour - 1))}
					</FormFeedback>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={handleHideSplitModal}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={!isSplitValid || isDeleting || isAddSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}

