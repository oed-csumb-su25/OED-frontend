/* eslint-disable @typescript-eslint/indent */
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateDayValues, selectIsValidCreateDay } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { useTranslate } from '../../redux/componentHooks';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { daysApi } from '../../redux/api/daysApi';

/**
 * Defines the create conversion modal form
 * @returns Conversion create element
 */
export default function CreateDayModalComponent() {
	const translate = useTranslate();
	const [addDayMutation] = daysApi.useAddDayMutation();

	const defaultValues = useAppSelector(selectDefaultCreateDayValues);

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// State for the warning modal
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [patternState, setPatternState] = useState({
	Day: {
		name: defaultValues.name,
		note: defaultValues.DayNote
	},
	initialSegment: {
		slope: defaultValues.slope,
		intercept: defaultValues.intercept,
		startHour: defaultValues.startHour,
		endHour: defaultValues.endHour,
		segmentNote: defaultValues.initialSegmentNote
	}
});

	// Check if the daily pattern is valid
	const [isValidDay, reason] = useAppSelector(state =>
		selectIsValidCreateDay(state, {
			name: patternState.Day.name
			// You can add more fields if your selector uses them
		})
	);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name === 'DayNote') {
				setPatternState(prev => ({
						...prev,
						Day: {
								...prev.Day,
								note: value
						}
				}));
		} else if (name === 'initialSegmentNote') {
				setPatternState(prev => ({
						...prev,
						initialSegment: {
								...prev.initialSegment,
								note: value
						}
				}));
		} else {
				setPatternState(prev => ({
						...prev,
						Day: {
								...prev.Day,
								name: value
						}
				}));
		}
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		const newValue = Number(value);
		if (name === 'slope') {
			setPatternState(prev => ({
				...prev,
				initialSegment: {
					...prev.initialSegment,
					slope: newValue
				}
			}));
		} else if (name === 'intercept') {
			setPatternState(prev => ({
				...prev,
				initialSegment: {
					...prev.initialSegment,
					intercept: newValue
				}
			}));
		}
	};

	/* Warning Modal */
	const handleWarningConfirm = () => {
		//Close the warning modal
		setShowWarningModal(false);
		// Add the new pattern and update the store
		addDayMutation({
			name: patternState.Day.name,
			slope: patternState.initialSegment.slope,
			intercept: patternState.initialSegment.intercept,
			note: patternState.Day.note,
			segmentNote: patternState.initialSegment.segmentNote
		});
		// Reset the state to default values
		resetState();
		// Close the modal
		setShowModal(false);
	};

	const handleWarningCancel = () => {
		//Close the warning modal
		setShowWarningModal(false);
	};

	// Reset the state to default values
	const resetState = () => {
		setPatternState({
			Day: {
				name: defaultValues.name,
				note: defaultValues.DayNote
			},
			initialSegment: {
				slope: defaultValues.slope,
				intercept: defaultValues.intercept,
				startHour: defaultValues.startHour,
				endHour: defaultValues.endHour,
				segmentNote: defaultValues.initialSegmentNote
			}
		});
	};
	/* End Warning Modal */

	// Submit
	const handleSubmit = () => {
		// Show warning modal if slope and intercept are both 0
		if (patternState.initialSegment.slope === 0 && patternState.initialSegment.intercept === 0) {
			setWarningMessage(translate('day.slope.intercept.zero'));
			setShowWarningModal(true);
		} else {
			// Close modal first to avoid repeat clicks
			setShowModal(false);
			// Add the new pattern and update the store
			addDayMutation({
				name: patternState.Day.name,
				slope: patternState.initialSegment.slope,
				intercept: patternState.initialSegment.intercept,
				note: patternState.Day.note,
				segmentNote: patternState.initialSegment.segmentNote
			});
			// Reset the state to default values
			resetState();
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateConversionView: 'help.admin.daycreate'
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')}
			/>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="day.create" />
			</Button>

			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="day.create" />
					<TooltipHelpComponent page='day-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='day-create' helpTextId={tooltipStyle.tooltipCreateConversionView} />
					</div>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						{/* Name for daily pattern*/}
						<FormGroup>
							<Label for='name'>{translate('name')}</Label>
							<Input
								id='DayName'
								name='DayName'
								type='text'
								onChange={e => handleStringChange(e)}
								value={patternState.Day.name}
								invalid={!patternState.Day.name || patternState.Day.name.trim() === ''} // TODO: OED needs to decide how to trim names universally
								required
							/>
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup>
						{/* Note input for overall conversion*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='DayNote'
								name='DayNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={patternState.Day.note} />
						</FormGroup>
						{/*Initial pattern*/}
						<h5>
							<FormattedMessage id="initial.pattern" />
						</h5>
						<Row xs='1' lg='2'>
							<Col>
								{/* Slope input*/}
								<FormGroup>
									<Label for='slope'>{translate('conversion.slope')}</Label>
									<Input
										id='slope'
										name='slope'
										type='number'
										value={patternState.initialSegment.slope}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
							<Col>
								{/* Intercept input*/}
								<FormGroup>
									<Label for='intercept'>{translate('conversion.intercept')}</Label>
									<Input
										id='intercept'
										name='intercept'
										type='number'
										value={patternState.initialSegment.intercept}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* Start hour input*/}
								<FormGroup>
									<Label for='startHour'>{translate('day.start.hour')}</Label>
									<Input
										id='startHour'
										name='startHour'
										type='number'
										value={patternState.initialSegment.startHour}
										disabled
										readOnly
									/>
								</FormGroup>
							</Col>
							<Col>
								{/* End hour input*/}
								<FormGroup>
									<Label for='endHour'>{translate('day.end.hour')}</Label>
									<Input
										id='endHour'
										name='endHour'
										type='number'
										value={patternState.initialSegment.endHour}
										disabled
										readOnly
									/>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input for initial pattern*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='initialSegmentNote'
								name='initialSegmentNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={patternState.initialSegment.segmentNote} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{
						// TODO: looks kind of bad make a better visible notification
						!isValidDay && <p>{reason}</p>
					}
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!isValidDay}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
