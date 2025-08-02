/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { DaySegment, UpdateDaySegmentPayload } from '../../types/redux/days';
import { showErrorNotification } from '../../utils/notifications';


/**
 * Given an hour in range [0, 24], returns the time in format HH:MM{AM|PM}
 * @param hour The hour to transform
 * @returns time in format HH:MM{AM|PM}
 */
function hourToTime(hour: number) {
	const suffix = hour === 0 || hour === 24 ? 'AM' : hour < 12 ? 'AM' : 'PM';
	let displayHour = hour % 12;
	if (displayHour === 0) {
		displayHour = 12;
	}
	return `${displayHour}:00 ${suffix}`;
}

interface EditDaySegmentModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;

	/**
	 * The day segment to edit
	 */
	daySegment: DaySegment;

	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

/**
 * /**
 * Defines a modal that allows editing of an existing Day Segment.
 * @param props - The properties for the component
 * @returns Day segment edit element
 */
export default function EditDaySegmentModalComponent(props: EditDaySegmentModalComponentProps): React.ReactElement {
	const [daySegment, setDaySegment] = React.useState<UpdateDaySegmentPayload>(
		{ ...props.daySegment, originalStartHour: props.daySegment.startHour, originalEndHour: props.daySegment.endHour }
	);

	// Fetch day segments by day ID to validate start and end hours
	const { data: daySegments = [] } = daySegmentsApi.useGetDailyPatternSegmentsByDayIdQuery(props.daySegment.dayId);

	const [editDaySegmentMutation, { isLoading: isSaving }] = daySegmentsApi.useEditDailyPatternSegmentMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: e.target.value });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: Number(e.target.value) });
	};

	const handleSubmit = () => {
		if (!isSegmentValid) {
			return;
		}
		editDaySegmentMutation(daySegment).unwrap()
			.then(() => {
				props.handleClose();
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	// Validate the start hour
	// It should be a valid hour and not conflict with existing segments
	const isStartHourValid = React.useMemo(() => {
		if (daySegment.startHour < 0 || daySegment.startHour >= daySegment.endHour || daySegment.startHour >= 24 || daySegment.startHour < 0) {
			return false;
		}
		// Check if the start hour does not conflict with existing segments
		const segmentIndex = daySegments.findIndex(s => s.id === daySegment.id);
		if (segmentIndex > 0) {
			const earlierSegment = daySegments[segmentIndex - 1];
			return daySegment.startHour > earlierSegment.startHour;
		}

		return true;
	}, [daySegment.startHour, daySegment.endHour]);

	// Validate the end hour
	// It should be a valid hour and not conflict with existing segments
	const isEndHourValid = React.useMemo(() => {
		if (daySegment.endHour <= daySegment.startHour || daySegment.endHour > 24 || daySegment.endHour < 0) {
			return false;
		}
		// Check if the end hour does not conflict with existing segments
		const segmentIndex = daySegments.findIndex(s => s.id === daySegment.id);
		if (segmentIndex < daySegments.length - 1) {
			const laterSegment = daySegments[segmentIndex + 1];
			return daySegment.endHour < laterSegment.endHour;
		}
		return true;
	}, [daySegment.startHour, daySegment.endHour]);

	// Validate the segment as a whole
	// It should have valid start and end hours
	const isSegmentValid = React.useMemo(() => {
		return isStartHourValid && isEndHourValid;
	}, [daySegment.startHour, daySegment.endHour]);


	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} backdrop="static">
				<ModalHeader toggle={props.handleClose}>
					{/* TODO: internationalize */}
					Edit Segment
				</ModalHeader>
				<ModalBody>
					<FormGroup>
						{/* TODO: internationalize */}
						<Label for="segment-slope">Slope</Label>
						<Input
							id="segment-slope"
							name="slope"
							type="number"
							required
							value={daySegment.slope}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						{/* TODO: internationalize */}
						<Label for="segment-intercept">Intercept</Label>
						<Input
							id="segment-intercept"
							name="intercept"
							type="number"
							required
							value={daySegment.intercept}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Row>
							<Col>
								<Label for="segment-start-hour">
									<FormattedMessage id="daily.patterns.start.hour" />
								</Label>
								<Input
									id="segment-start-hour"
									name="startHour"
									type="number"
									min={0}
									max={daySegment.endHour - 1}
									step="1"
									value={daySegment.startHour}
									onChange={handleNumberChange}
									invalid={!isStartHourValid}
									valid={isStartHourValid}
									disabled={daySegment.originalStartHour === 0}
								/>
								<FormFeedback valid>
									{hourToTime(daySegment.startHour)}
								</FormFeedback>
								<FormFeedback>
									<FormattedMessage id="invalid.input" />
								</FormFeedback>
							</Col>
							<Col>
								<Label for="segment-end-hour">
									<FormattedMessage id="daily.patterns.end.hour" />
								</Label>
								<Input
									id="segment-end-hour"
									name="endHour"
									type="number"
									min={daySegment.startHour + 1}
									max={24}
									step="1"
									value={daySegment.endHour}
									onChange={handleNumberChange}
									invalid={!isEndHourValid}
									valid={isEndHourValid}
									disabled={daySegment.originalEndHour === 24}
								/>
								<FormFeedback valid>
									{hourToTime(daySegment.endHour)}
								</FormFeedback>
								<FormFeedback>
									<FormattedMessage id="invalid.input" />
								</FormFeedback>
							</Col>
						</Row>
					</FormGroup>
					<FormGroup>
						<Label for="segment-note">
							<FormattedMessage id="note" />
						</Label>
						<Input
							id="segment-note"
							name="note"
							type="textarea"
							value={daySegment.note ?? ''}
							onChange={handleStringChange}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					{/* Discard changes */}
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Save changes */}
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={!isSegmentValid || isSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
