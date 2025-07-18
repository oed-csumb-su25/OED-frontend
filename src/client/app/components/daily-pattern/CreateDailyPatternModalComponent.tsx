/* eslint-disable @typescript-eslint/indent */
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateDailyPatternValues } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { useTranslate } from '../../redux/componentHooks';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
/**
 * Defines the create conversion modal form
 * @returns Conversion create element
 */
export default function CreateDailyPatternModalComponent() {
	const translate = useTranslate();
	//const [addConversionMutation] = conversionsApi.useAddConversionMutation();
	// Want units in sorted order by identifier regardless of case.

	const defaultValues = useAppSelector(selectDefaultCreateDailyPatternValues);

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
  dailyPattern: {
		name: defaultValues.name,
    note: defaultValues.dailyPatternNote
  },
  initialPattern: {
    slope: defaultValues.slope,
    intercept: defaultValues.intercept,
		startHour: defaultValues.startHour,
		endHour: defaultValues.endHour,
    note: defaultValues.initialPatternNote
  }
});

	// TODO: Add a check for the fields in daily pattern
	// const [validConversion, reason] = useAppSelector(state =>
	// 	selectIsValidConversion(state, {
	// 		sourceId: conversionState.initialConversion.sourceId,
	// 		destinationId: conversionState.initialConversion.destinationId,
	// 		bidirectional: conversionState.initialConversion.bidirectional,
	// 		slope: conversionState.initialConversion.slope,
	// 		intercept: conversionState.initialConversion.intercept,
	// 		//pattern: conversionState.initialConversion.pattern,
	// 		note: conversionState.initialConversion.note
	// 	})
	// );

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'dailyPatternNote') {
        setPatternState(prev => ({
            ...prev,
            dailyPattern: {
                ...prev.dailyPattern,
                note: value
            }
        }));
    } else if (name === 'initialPatternNote') {
        setPatternState(prev => ({
            ...prev,
            initialPattern: {
                ...prev.initialPattern,
                note: value
            }
        }));
    }
	};

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = Number(value);
		console.log(`handleNumberChange: ${name} = ${newValue}`);

    // setConversionState(prev => {
    //     if (name === 'sourceId') {
    //         return {
    //             ...prev,
    //             dailyPattern: {
    //                 ...prev.dailyPattern,
    //                 sourceId: newValue
    //             },
    //             initialPattern: {
    //                 ...prev.initialPattern,
    //                 sourceId: newValue
    //             }
    //         };
    //     } else if (name === 'destinationId') {
    //         return {
    //             ...prev,
    //             overallConversion: {
    //                 ...prev.overallConversion,
    //                 destinationId: newValue
    //             },
    //             initialConversion: {
    //                 ...prev.initialConversion,
    //                 destinationId: newValue
    //             },
    //             sourceOptions: defaultValues.sourceOptions.filter(source => source.id !== newValue)
    //         };
    //     } else {
    //         return {
    //             ...prev,
    //             initialConversion: {
    //                 ...prev.initialConversion,
    //                 [name]: newValue
    //             }
    //         };
    //     }
    // });
	};

	/* Warning Modal */
	const handleWarningConfirm = () => {
		//Close the warning modal
		setShowWarningModal(false);

		// TODO: Replace this with a proper overall and initial conversion creation logic once the backend is ready
		// Create a placeholder payload for the conversion creation until backend is ready
		// const payload = {
		// 	sourceId: conversionState.overallConversion.sourceId,
		// 	destinationId: conversionState.overallConversion.destinationId,
		// 	bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.overallConversion.bidirectional,
		// 	note: conversionState.overallConversion.note,
		// 	slope: conversionState.initialConversion.slope,
		// 	intercept: conversionState.initialConversion.intercept,
		// 	pattern: conversionState.initialConversion.pattern,
		// 	initialNote: conversionState.initialConversion.note
		// };
		// console.log(
		// 	'sourceId:', conversionState.overallConversion.sourceId, typeof conversionState.overallConversion.sourceId,
		// 	'destinationId:', conversionState.overallConversion.destinationId, typeof conversionState.overallConversion.destinationId
		// );
		// addConversionMutation(payload);
		resetState();
	};

	const handleWarningCancel = () => {
		//Close the warning modal
		setShowWarningModal(false);
	};

	// Reset the state to default values
	const resetState = () => {
		setPatternState({
			dailyPattern: {
				name: defaultValues.name,
				note: defaultValues.dailyPatternNote
			},
			initialPattern: {
				slope: defaultValues.slope,
				intercept: defaultValues.intercept,
				startHour: defaultValues.startHour,
				endHour: defaultValues.endHour,
				note: defaultValues.initialPatternNote
			}
		});
	};
	/* End Warning Modal */

	// Submit
	const handleSubmit = () => {
		// Show warning modal if slope and intercept are both 0
		if (patternState.initialPattern.slope === 0 && patternState.initialPattern.intercept === 0) {
			setWarningMessage(translate('conversion.slope.intercept.zero'));
			setShowWarningModal(true);
		} else {
			// Close modal first to avoid repeat clicks
			setShowModal(false);
			// Add the new conversion and update the store
			// Omit the source options , do not need to send in request so remove here.
			// If source is a meter, make bidirectional false
			// If source or destination is a suffix unit, make bidirectional false

			// TODO: Replace this with a proper overall and initial conversion creation logic once the backend is ready
			// Example updated logic for creating a conversion:
			// 1. Create overall conversion
			//const overallResult = await addConversionMutation(conversionState.overallConversion).unwrap();
			// 2. Create initial conversion with foreign key
			// await addConversionMutation({
			// 	...conversionState.initialConversion,
			// 	overallConversionId: overallResult.id
			// });

			// Create a placeholder payload for the conversion creation until backend is ready
			// const payload = {
      //   sourceId: conversionState.overallConversion.sourceId,
      //   destinationId: conversionState.overallConversion.destinationId,
      //   bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.overallConversion.bidirectional,
      //   note: conversionState.overallConversion.note,
      //   slope: conversionState.initialConversion.slope,
      //   intercept: conversionState.initialConversion.intercept,
      //   pattern: conversionState.initialConversion.pattern,
      //   initialNote: conversionState.initialConversion.note
			// };
			// addConversionMutation(payload);
			resetState();
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateConversionView: 'help.admin.conversioncreate'
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
				<FormattedMessage id="daily.patterns.create" />
			</Button>

			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="daily.patterns.create" />
					<TooltipHelpComponent page='daily-pattern-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='daily-pattern-create' helpTextId={tooltipStyle.tooltipCreateConversionView} />
					</div>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						{/* Name for daily pattern*/}
						<FormGroup>
							<Label for='name'>{translate('name')}</Label>
							<Input
								id='dailyPatternName'
								name='dailyPatternName'
								type='text'
								onChange={e => handleStringChange(e)}
								value={patternState.dailyPattern.note} />
						</FormGroup>
						{/* Note input for overall conversion*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='dailyPatternNote'
								name='dailyPatternNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={patternState.dailyPattern.note} />
						</FormGroup>
						{/*Initial pattern*/}
						<h5 className="mt-3 mb-2">
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
										value={patternState.initialPattern.slope}
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
										value={patternState.initialPattern.intercept}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* Start hour input*/}
								<FormGroup>
									<Label for='startHour'>{translate('daily.patterns.start.hour')}</Label>
									<Input
										id='startHour'
										name='startHour'
										type='number'
										value={patternState.initialPattern.startHour}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
							<Col>
								{/* End hour input*/}
								<FormGroup>
									<Label for='endHour'>{translate('daily.patterns.end.hour')}</Label>
									<Input
										id='endHour'
										name='endHour'
										type='number'
										value={patternState.initialPattern.endHour}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
						</Row>
						{/* Note input for initial pattern*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='initialPatternNote'
								name='initialPatternNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={patternState.initialPattern.note} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{
						// Todo looks kind of bad make a better visible notification
						// !validConversion && <p>{reason}</p>
					}

					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} >
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
