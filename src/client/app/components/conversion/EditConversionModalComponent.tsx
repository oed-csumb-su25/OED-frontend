/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment-timezone';
import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
	Button, Col, Container,
	FormFeedback,
	FormGroup,
	Input, Label, Modal, ModalBody, ModalFooter, ModalHeader,
	Pagination,
	PaginationItem, PaginationLink,
	Row, Table
} from 'reactstrap';
import { conversionsApi, selectConversionsDetails } from '../../redux/api/conversionsApi';
import { conversionSegmentsApi } from '../../redux/api/conversionSegmentsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { weeksApi } from '../../redux/api/weeksApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { ConversionData } from '../../types/redux/conversions';
import { ConversionSegmentData, UpdateConversionSegmentPayload } from '../../types/redux/conversionSegments';
import { UnitData, UnitType } from '../../types/redux/units';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditConversionModalComponentProps {
	show: boolean;
	conversion: ConversionData;
	conversionIdentifier: string;
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
}

const modalSectionDividerStyle: React.CSSProperties = {
	borderTop: '1px solid gray',
	left: '-2rem',
	width: '100vw',
	position: 'relative'
};

/**
 * Defines the edit conversion modal form
 * @param props Props for the component
 * @returns Conversion edit element
 */
export default function EditConversionModalComponent(props: EditConversionModalComponentProps) {
	const translate = useTranslate();
	const intl = useIntl();
	const [editConversion] = conversionsApi.useEditConversionMutation();
	const [deleteConversion] = conversionsApi.useDeleteConversionMutation();
	const [editSegment] = conversionSegmentsApi.useEditConversionSegmentMutation();
	const [splitEarlier] = conversionSegmentsApi.useSplitConversionSegmentEarlierMutation();
	const [splitLater] = conversionSegmentsApi.useSplitConversionSegmentLaterMutation();
	const [deleteEarlier] = conversionSegmentsApi.useDeleteConversionSegmentEarlierMutation();
	const [deleteLater] = conversionSegmentsApi.useDeleteConversionSegmentLaterMutation();
	const getSegments = conversionSegmentsApi.useGetConversionSegmentByConversionQuery({
		sourceId: props.conversion.sourceId,
		destinationId: props.conversion.destinationId
	});
	const getWeeks = weeksApi.useGetWeeksQuery();
	const unitDataById = useAppSelector(selectUnitDataById);
	const meterDataById = useAppSelector(selectMeterDataById);
	const conversionDetails = useAppSelector(selectConversionsDetails);

	// Set existing conversion values
	const values = { ...props.conversion };

	/* State */
	// Handlers for each type of input change
	const [state, setState] = useState(values);
	// Tracks the active segment being edited, with original start/end times used to match and update the correct entry in the backend
	const [editingSegment, setEditingSegment] = useState<UpdateConversionSegmentPayload | null>(null);
	const [showSegmentNoteModal, setShowSegmentNoteModal] = React.useState(false);
	const [showEditSegmentModal, setShowEditSegmentModal] = React.useState(false);
	const [showSplitSegmentModal, setShowSplitSegmentModal] = React.useState(false);
	const [actionDirection, setActionDirection] = useState<'earlier' | 'later' | null>(null);
	const [selectedSegment, setSelectedSegment] = useState<ConversionSegmentData | null>(null);
	const [actionDatetime, setActionDatetime] = useState('');
	const [fieldErrors, setFieldErrors] = useState<{ segmentTimeError?: string; errorField?: string }>({});
	const [currentPage, setCurrentPage] = React.useState(1);
	const [showAllSegments, setShowAllSegments] = React.useState(false);

	// Extract data and utilities from query hooks for easier usage
	const segments = getSegments.data ?? [];
	const weekPatterns = getWeeks.data ?? [];

	const PER_TABLE = 10;
	const totalPages = Math.ceil(segments.length / PER_TABLE);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleSegmentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditingSegment(prev => ({
			...prev!,
			[e.target.name]: Number(e.target.value), // dynamically sets either slope or intercept
			weekPatternsId: -99 // reset pattern if editing slope/intercept
		}));
	};

	// Updates the pattern and resets slope/intercept if "No Pattern" is selected
	const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedPattern = Number(e.target.value);
		setEditingSegment(prev => {
			if (selectedPattern === -99) {
				return {
					...prev!,
					weekPatternsId: -99,
					slope: 0,
					intercept: 0
				};
			} else {
				return {
					...prev!,
					weekPatternsId: selectedPattern
				};
			}
		});
	};

	// Updates the note field for the currently edited segment
	// Separate handler needed since segment editing uses different state
	const handleSegmentNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditingSegment(prev => ({
			...prev!,
			note: e.target.value
		}));
	};

	// Opens a modal showing the full segment note
	const handleNoteModal = (segment: ConversionSegmentData) => {
		setSelectedSegment(segment);
		setShowSegmentNoteModal(true);
	};

	// Updates datetime values (start, end, or split) based on user input
	const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// Handle if splitting segment
		if (e.target.name === 'splitDatetime') {
			setActionDatetime(e.target.value);
			setFieldErrors(prev => (prev.errorField === 'splitDatetime' ? {} : prev));
			// Handle if editing a segment
		} else if (editingSegment && (e.target.name === 'startTime' || e.target.name === 'endTime')) {
			setEditingSegment(prev => ({
				...prev!,
				[e.target.name]: e.target.value
			}));
			setFieldErrors(prev => (prev.errorField === e.target.name ? {} : prev));
		}
	};

	// Splits a selected segment into two based on the chosen datetime and direction
	const handleSplitSegment = async () => {
		const splitTime = moment(actionDatetime, 'YYYY-MM-DD HH:mm:ss', true);
		const isFormatValid = splitTime.isValid();
		const isStartTimeValid = selectedSegment!.startTime === '-infinity' || splitTime.isAfter(moment(selectedSegment!.startTime));
		const isEndTimeValid = selectedSegment!.endTime === 'infinity' || splitTime.isBefore(moment(selectedSegment!.endTime));

		if (!isFormatValid) {
			setFieldErrors({
				segmentTimeError: intl.formatMessage(
					{ id: 'conversion.error.datetime.invalid' },
					{ field: 'splitDatetime' }
				),
				errorField: 'splitDatetime'
			});
			return;
		}
		if (!isStartTimeValid || !isEndTimeValid) {
			setFieldErrors({
				segmentTimeError: translate('conversion.error.segment.splitTime'),
				errorField: 'splitDatetime'
			});
			return;
		}

		try {
			const splitTarget = {
				sourceId: selectedSegment!.sourceId,
				destinationId: selectedSegment!.destinationId,
				startTime: selectedSegment!.startTime,
				endTime: selectedSegment!.endTime,
				newSlope: selectedSegment!.slope,
				newIntercept: selectedSegment!.intercept,
				newWeekPatternsId: selectedSegment!.weekPatternsId !== -99 ? selectedSegment!.weekPatternsId : null,
				newNote: selectedSegment!.note ?? null,
				splitTime: actionDatetime
			};
			if (actionDirection === 'earlier') {
				await splitEarlier(splitTarget).unwrap();
			} else if (actionDirection === 'later') {
				await splitLater(splitTarget).unwrap();
			}
			showSuccessNotification(translate('conversion.segment.split.success'));
			setShowSplitSegmentModal(false);
			setSelectedSegment(null);
			setActionDirection(null);
			setActionDatetime('');
		} catch (error) {
			showErrorNotification(translate('conversion.segment.split.error'));
		}
	};

	// Deletes the selected segment and updates the adjacent segment's time range
	// to preserve continuous coverage with no time gaps or overlaps
	const handleDeleteSegment = async () => {
		try {
			const deleteTarget = {
				sourceId: selectedSegment!.sourceId,
				destinationId: selectedSegment!.destinationId,
				startTime: selectedSegment!.startTime,
				endTime: selectedSegment!.endTime
			};
			// Call the appropriate backend route based on direction
			if (actionDirection === 'earlier') {
				await deleteEarlier(deleteTarget).unwrap();
			} else if (actionDirection === 'later') {
				await deleteLater(deleteTarget).unwrap();
			}
			showSuccessNotification(translate('conversion.segment.delete.success'));
			setSelectedSegment(null);
			setActionDirection(null);
		} catch (error) {
			showErrorNotification(translate('conversion.segment.delete.error'));
		}
	};
	/* End State */

	// Determines whether the selected source is of type meter
	const isMeterSource = () => {
		const source = unitDataById[state.sourceId];
		return source?.typeOfUnit === UnitType.meter;
	};

	// Determine whether the selected source or destination is a suffix unit
	const isSuffixUsed = () => {
		const source = unitDataById[state.sourceId];
		const dest = unitDataById[state.destinationId];
		return source?.typeOfUnit === UnitType.suffix || dest?.typeOfUnit === UnitType.suffix;
	};

	/**
	 * Calculates the number of conversions that use a given unit as a source or destination (not both).
	 * @param unit The unit that is used for calculating the number of conversions.
	 * @param conversions An array of conversion data objects, each representing a conversion
	 * @returns The sum of conversions that use the provided unit.
	 */
	const getConversionCount = (unit: UnitData, conversions: ConversionData[]) => {
		let count = 0;
		const unitId = unit.id;
		// If the given unit is a source only count conversions that share the same source.
		if (unitId === state.sourceId) {
			for (const conversion of conversions) {
				if (conversion.sourceId === unitId) {
					count++;
				}
			}
			// If the given unit is a destination only count conversions that share the same destination.
		} else if (unitId === state.destinationId) {
			for (const conversion of conversions) {
				if (conversion.destinationId === unitId) {
					count++;
				}
			}
		}
		return count;
	};

	// Performs checks to warn the admin of the impact deleting a conversion will have on meter units and possible graphing units.
	const checkState = () => {
		const source = unitDataById[state.sourceId];
		const dest = unitDataById[state.destinationId];
		let msg = '';
		let cancel = false;
		if (source.typeOfUnit === UnitType.meter) {
			// How many conversions have this conversion's source so are conversions from a meter.
			const srcCount = getConversionCount(source, conversionDetails);
			// How many meters use this conversion, i.e., have the source as its unit.
			const relatedMeters = Object.values(meterDataById).filter(meter => meter.unitId === source.id);
			if (srcCount === 1 && relatedMeters.length !== 0) {
				// This is the only conversion for this meter unit so if it is removed then
				// you cannot graph any meters using this unit. Not allowed to delete if
				// any meters use this unit as in this case.
				msg += `${translate('conversion.delete.meter.orphan')} "${source.name}".\n`;
				msg += `${translate('conversion.delete.meter.related')} "${source.name}":\n`;
				relatedMeters.forEach(meter => {
					msg += `"${meter.name}"\n`;
				});
				cancel = true;
			} else if (relatedMeters.length !== 0) {
				// Some meters use this meter unit but there are other ways to graphic it
				// so warn the admin and tell each meter impacted.
				msg += `${translate('conversion.delete.meter.related')} "${source.name}":\n`;
				relatedMeters.forEach(meter => {
					msg += `"${meter.name}"\n`;
				});
				msg += `${translate('conversion.delete.meter.reduce.graphable')} "${source.name}".\n`;
			} else if (srcCount === 1) {
				// No meters use this meter unit so warn that will is ungraphable if used.
				msg += `${translate('conversion.delete.meter.orphan')} "${source.name}".\n`;
			} else {
				// No meters use this meter unit so warn that reduced graphable units if used.
				msg += `${translate('conversion.delete.meter.reduce.graphable')} "${source.name}".\n`;
			}
			// TODO The following code did what was originally in issue #905 but there were issues
			// with the design and usage of suffix units. It is commented out for now and needs
			// to be revisited when the design for suffix is better.
			// } else if (source.typeOfUnit === UnitType.suffix) {
			// 	const srcCount = getConversionCount(source, conversionDetails);
			// 	if (srcCount === 1) {
			// 		msg += `${translate('conversion.delete.suffix.disable')} "${source.name}".\n`;
			// 	}
		} else if (source.typeOfUnit === UnitType.unit && dest.typeOfUnit === UnitType.unit) {
			const destConversions = conversionDetails.filter(conversion =>
				(conversion.destinationId === dest.id) ||
				(conversion.bidirectional && conversion.sourceId === dest.id)
			);

			const remainingDestConversions = destConversions.filter(conversion =>
				!(conversion.sourceId === source.id && conversion.destinationId === dest.id)
			);

			if (remainingDestConversions.length === 0) {
				msg += `${translate('conversion.delete.unit.orphan')} "${dest.name}".\n`;
				cancel = true;
			}

			if (msg === '') {
				msg += `${translate('conversion.delete.unit')}\n`;
				// TODO: Check after deleting the conversion to see if a change happens.
				// 		 Notify the admin of any consequences caused by deleting the conversion.
			}
		}

		if (msg === '') {
			handleDeleteConfirmationModalOpen();
		} else if (cancel) {
			setDeleteConfirmationMessage(msg + `${translate('conversion.delete.restricted')}\n`);
			handleCancelModalOpen();
		} else {
			setDeleteConfirmationMessage(msg + translate('conversion.delete.conversion') + ' [' + props.conversionIdentifier + '] ?');
			handleDeleteConfirmationModalOpen();
		}
	};

	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useState(
		translate('conversion.delete.conversion') + ' [' + props.conversionIdentifier + '] ?');
	const deleteConfirmText = translate('conversion.delete.conversion');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};
	const handleDeleteConversion = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		// Delete the conversion using the state object, it should only require the source and destination ids set
		deleteConversion({ sourceId: state.sourceId, destinationId: state.destinationId });
	};

	const handleCancelModalClose = () => {
		// Hide the warning modal
		setShowCancelModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleCancelModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowCancelModal(true);
	};
	const handleCancel = () => {
		// Closes the warning modal
		setShowCancelModal(false);
	};

	/* End Confirm Delete Modal */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateConversionModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit conversions will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
	};

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};
	/* Warning Modal State */
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const handleWarningConfirm = async () => {
		// Close the warning modal
		setShowWarningModal(false);

		// If this warning is for a neutral segment edit
		// perform the save and exit early to avoid closing the Edit Conversion Modal
		if (editingSegment) {
			try {
				await editSegment({
					segment: editingSegment,
					originalStartTime: editingSegment.originalStartTime,
					originalEndTime: editingSegment.originalEndTime
				}).unwrap();
				showSuccessNotification(translate('conversion.segment.save.success'));
				setShowEditSegmentModal(false);
				setSelectedSegment(null);
				setEditingSegment(null);
			} catch (error) {
				showErrorNotification(translate('conversion.segment.save.error'));
			}
			return;
		}

		// If this warning is for a segment delete (earlier/later),
		// perform the delete and exit early to avoid closing the Edit Conversion Modal
		if (selectedSegment && actionDirection) {
			await handleDeleteSegment();
			return;
		}

		// Proceed with saving changes
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// Need to redo Cik if bidirectional changes.
		const shouldRedoCik = props.conversion.bidirectional !== state.bidirectional;
		// Check for changes by comparing state to props
		const conversionHasChanges = shouldRedoCik || props.conversion.note != state.note;
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes
			editConversion({
				conversionData: {
					...state,
					bidirectional: (isMeterSource() || isSuffixUsed()) ? false : state.bidirectional
				}, shouldRedoCik
			});
		}
	};
	const handleWarningCancel = () => {
		// Close the warning modal
		setShowWarningModal(false);
	};

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input i
	// Edit Conversion Validation: is not needed as no breaking edits can be made
	const handleSaveChanges = () => {
		// Need to redo Cik if bidirectional changes.
		const shouldRedoCik = props.conversion.bidirectional !== state.bidirectional;
		// Check for changes by comparing state to props
		const conversionHasChanges = shouldRedoCik || props.conversion.note != state.note;
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes
			editConversion({
				conversionData: {
					...state,
					bidirectional: (isMeterSource() || isSuffixUsed()) ? false : state.bidirectional
				}, shouldRedoCik
			});
		}
	};

	const handleSaveSegment = async () => {
		// Prevent saving if start time or end time is not in valid format and display error message
		const isStartTimeValid = moment(editingSegment?.startTime, 'YYYY-MM-DD HH:mm:ss', true).isValid() || editingSegment?.startTime === '-infinity';
		const isEndTimeValid = moment(editingSegment?.endTime, 'YYYY-MM-DD HH:mm:ss', true).isValid() || editingSegment?.endTime === 'infinity';
		if (!isStartTimeValid) {
			setFieldErrors({
				segmentTimeError: intl.formatMessage(
					{ id: 'conversion.error.datetime.invalid' },
					{ field: 'startTime' }
				),
				errorField: 'startTime'
			});
			return;
		}

		if (!isEndTimeValid) {
			setFieldErrors({
				segmentTimeError: intl.formatMessage(
					{ id: 'conversion.error.datetime.invalid' },
					{ field: 'endTime' }
				),
				errorField: 'endTime'
			});
			return;
		}
		// If editing a segment's time range, ensure there are no gaps or overlaps with adjacent segments,
		// but only if the range is bounded (i.e., not -infinity or infinity).
		if (editingSegment) {
			// Find the index of the segment being edited
			const index = segments.findIndex(
				seg => seg.startTime === editingSegment.originalStartTime && seg.endTime === editingSegment.originalEndTime
			);
			// Grab previous and next segments if they exist
			const previous = segments[index - 1];
			const next = segments[index + 1];
			// Check for gaps/overlaps with previous segment
			if (previous && !moment.utc(editingSegment.startTime, 'YYYY-MM-DD HH:mm:ss').isSame(moment.utc(previous.endTime))) {
				setFieldErrors(prev => ({
					...prev,
					segmentTimeError: intl.formatMessage(
						{ id: 'conversion.error.segment.startTimeMismatch' },
						{ endTime: previous.endTime }
					),
					errorField: 'startTime'
				}));
				return;
			}
			// Check for gaps/overlaps with next segment
			if (next && !moment.utc(editingSegment.endTime, 'YYYY-MM-DD HH:mm:ss').isSame(moment.utc(next.startTime))) {
				setFieldErrors(prev => ({
					...prev,
					segmentTimeError: intl.formatMessage(
						{ id: 'conversion.error.segment.endTimeMismatch' },
						{ startTime: next.startTime }
					),
					errorField: 'endTime'
				}));
				return;
			}
			// Warn the user if they are saving a "neutral" segment (no pattern, slope=0, intercept=0),
			// since it will not impact conversion results and may be unintended.
			if (editingSegment.slope === 0 && editingSegment.intercept === 0 && editingSegment.weekPatternsId === -99) {
				setWarningMessage(intl.formatMessage({ id: 'conversion.warning.segment.neutral' }));
				setSelectedSegment(editingSegment);
				setShowWarningModal(true);
				return;
			}
		}
		// If a segment is being edited, send the updated data to the backend
		// and close the edit segment modal if the request succeeds.
		if (editingSegment) {
			try {
				await editSegment({
					segment: editingSegment,
					originalStartTime: editingSegment.originalStartTime,
					originalEndTime: editingSegment.originalEndTime
				}).unwrap();
				showSuccessNotification(translate('conversion.segment.save.success'));
				setShowEditSegmentModal(false);
				setSelectedSegment(null);
				setEditingSegment(null);
			} catch (error) {
				showErrorNotification(translate('conversion.segment.save.error'));
			}
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditConversionView: 'help.admin.conversionedit'
	};

	return (
		<>
			{/* Warning Modal */}
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')} />
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteConversion}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<ConfirmActionModalComponent
				show={showCancelModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleCancelModalClose}
				actionFunction={handleCancel}
				actionConfirmText={deleteRejectText}
				actionRejectText={deleteRejectText}
				forceCancel={true} />
			<Modal isOpen={showSegmentNoteModal} toggle={() => setShowSegmentNoteModal(false)} centered>
				<ModalHeader toggle={() => setShowSegmentNoteModal(false)}>
					{selectedSegment?.startTime} to {selectedSegment?.endTime}
				</ModalHeader>
				<ModalBody>
					{selectedSegment?.note}
				</ModalBody>
			</Modal>
			{showEditSegmentModal && (
				<Modal isOpen={showEditSegmentModal} toggle={() => setShowEditSegmentModal(false)}>
					<ModalHeader>
						<FormattedMessage id='conversion.edit.conversion' />
					</ModalHeader>
					<ModalBody>
						<FormGroup>
							<Label for='startTime'>{translate('conversion.time.start')}</Label>
							<Input
								type='text'
								name='startTime'
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={editingSegment?.startTime ?? ''}
								onChange={e => handleDatetimeChange(e)}
								invalid={fieldErrors.errorField === 'startTime'}
								disabled={editingSegment?.startTime === '-infinity'}
							/>
							<FormFeedback className='d-block'>
								{fieldErrors.errorField === 'startTime' ? fieldErrors.segmentTimeError : null}
							</FormFeedback>
						</FormGroup>
						<FormGroup>
							<Label for='endTime'>{translate('conversion.time.end')}</Label>
							<Input
								type='text'
								name='endTime'
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={editingSegment?.endTime ?? ''}
								onChange={e => handleDatetimeChange(e)}
								invalid={fieldErrors.errorField === 'endTime'}
								disabled={editingSegment?.endTime === 'infinity'}
							/>
							<FormFeedback className='d-block'>
								{fieldErrors.errorField === 'endTime' ? fieldErrors.segmentTimeError : null}
							</FormFeedback>
						</FormGroup>
						<FormGroup>
							<Label for='slope'>{translate('slope')}</Label>
							<Input
								name='slope'
								type='number'
								value={editingSegment?.slope ?? ''}
								onChange={e => handleSegmentNumberChange(e)}
								disabled={editingSegment?.weekPatternsId !== -99}
							/>
						</FormGroup>
						<FormGroup>
							<Label for='intercept'>{translate('intercept')}</Label>
							<Input
								name='intercept'
								type='number'
								value={editingSegment?.intercept ?? ''}
								onChange={e => handleSegmentNumberChange(e)}
								disabled={editingSegment?.weekPatternsId !== -99}
							/>
						</FormGroup>
						<FormGroup>
							<Label for='pattern'>{translate('conversion.pattern')}</Label>
							<Input
								id='pattern'
								name='pattern'
								type='select'
								value={editingSegment?.weekPatternsId ?? -99}
								onChange={e => handlePatternChange(e)}
							>
								<option value={-99}>No Pattern</option>
								{weekPatterns.map(pattern => (
									<option key={pattern.id} value={pattern.id}>{pattern.name}</option>
								))}
							</Input>
						</FormGroup>
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								type='textarea'
								value={editingSegment?.note ?? ''}
								onChange={e => handleSegmentNoteChange(e)}
							/>
						</FormGroup>
					</ModalBody>
					<ModalFooter>
						<Button color='secondary' onClick={() => setShowEditSegmentModal(false)}><FormattedMessage id='cancel' /></Button>
						<Button color='primary' onClick={handleSaveSegment}>
							<FormattedMessage id='save.all' />
						</Button>
					</ModalFooter>
				</Modal>
			)}
			{showSplitSegmentModal && (
				<Modal isOpen={showSplitSegmentModal} toggle={() => setShowSplitSegmentModal(false)}>
					<ModalHeader>
						<FormattedMessage id={`conversion.table.split.${actionDirection}`} />
						<p style={{ fontSize: '1.1rem', color: 'black' }}>
							{selectedSegment?.startTime} to {selectedSegment?.endTime}
						</p>
					</ModalHeader>
					<ModalBody>
						<p>
							<FormattedMessage id='conversion.split.datetime.prompt' />
						</p>
						<Input
							type='text'
							name='splitDatetime'
							value={actionDatetime}
							placeholder='YYYY-MM-DD HH:MM:SS (defaults to 00:00:00)'
							onChange={e => handleDatetimeChange(e)}
							invalid={!!fieldErrors.segmentTimeError}
						/>
						<FormFeedback className='d-block'>{fieldErrors.segmentTimeError}</FormFeedback>
					</ModalBody>
					<ModalFooter>
						<Button color='secondary' onClick={() => setShowSplitSegmentModal(false)}>
							<FormattedMessage id='cancel' />
						</Button>
						<Button color='primary' onClick={handleSplitSegment} disabled={!!fieldErrors.segmentTimeError}>
							<FormattedMessage id='confirm.action' />
						</Button>
					</ModalFooter>
				</Modal>
			)}

			<Modal isOpen={props.show} toggle={props.handleClose} size='xl'>
				<ModalHeader>
					<FormattedMessage id='conversion.overall' />
					<TooltipHelpComponent page='conversions-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='conversions-edit' helpTextId={tooltipStyle.tooltipEditConversionView} />
					</div>
					<p style={{ marginBottom: '0', fontSize: '1rem', color: 'gray' }}>
						<FormattedMessage id="conversion.overall.subtitle" />
					</p>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Source unit - display only */}
								<FormGroup>
									<Label for='sourceId'>{translate('conversion.source')}</Label>
									<Input
										id='sourceId'
										name='sourceId'
										type='text'
										defaultValue={unitDataById[state.sourceId]?.identifier}
										// Disable input to prevent changing ID value
										disabled>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								{/* Destination unit - display only */}
								<FormGroup>
									<Label for='destinationId'>{translate('conversion.destination')}</Label>
									<Input
										id='destinationId'
										name='destinationId'
										type='text'
										defaultValue={unitDataById[state.destinationId]?.identifier}
										// Disable input to prevent changing ID value
										disabled>
									</Input>
								</FormGroup>
							</Col>
						</Row>
						{/* Bidirectional Y/N input */}
						<FormGroup>
							<Label for='bidirectional'>{translate('conversion.bidirectional')}</Label>
							<Input
								id='bidirectional'
								name='bidirectional'
								type='select'
								defaultValue={state.bidirectional.toString()}
								onChange={e => handleBooleanChange(e)}
								invalid={(isMeterSource() || isSuffixUsed()) && state.bidirectional === true}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
							{isMeterSource() && state.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id='conversion.bidirectional.disabled.meter' />
								</FormFeedback>
							)}
							{isSuffixUsed() && state.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id='conversion.bidirectional.disabled.suffix' />
								</FormFeedback>
							)}
						</FormGroup>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								defaultValue={state.note}
								placeholder='Note'
								onChange={e => handleStringChange(e)} />
						</FormGroup>
						<hr style={modalSectionDividerStyle} />
						<h5 className='mt-4'><FormattedMessage id='conversion.segments.table' /></h5>
						<p style={{ fontSize: '1rem', color: 'gray', fontWeight: '500' }}>
							<FormattedMessage id="conversion.segments.table.subtitle" />
						</p>
						<Table striped bordered>
							<thead>
								<tr>
									<th><FormattedMessage id='date.range' /></th>
									<th><FormattedMessage id='slope' /></th>
									<th><FormattedMessage id='intercept' /></th>
									<th><FormattedMessage id='conversion.pattern' /></th>
									<th><FormattedMessage id='conversion.note' /></th>
									<th><FormattedMessage id='edit' /></th>
									<th><FormattedMessage id='conversion.table.split.earlier' /></th>
									<th><FormattedMessage id='conversion.table.split.later' /></th>
									<th><FormattedMessage id='conversion.table.delete.earlier' /></th>
									<th><FormattedMessage id='conversion.table.delete.later' /></th>
								</tr>
							</thead>
							<tbody>
								{(showAllSegments ? segments : segments.slice((currentPage - 1) * PER_TABLE, currentPage * PER_TABLE))
									.map(segment => (
										<tr key={`${segment.sourceId}-${segment.destinationId}-${segment.startTime}`}>
											<td>{segment.startTime} to {segment.endTime}</td>
											<td>{(segment.weekPatternsId ?? -99) === -99 ? segment.slope : ''}</td>
											<td>{(segment.weekPatternsId ?? -99) === -99 ? segment.intercept : ''}</td>
											<td>{weekPatterns.find(wp => wp.id === segment.weekPatternsId)?.name ?? 'No Pattern'}</td>
											<td
												style={{ cursor: 'pointer' }}
												onClick={() => handleNoteModal(segment)}
												aria-label={segment.note}
											>
												{(segment.note ?? '').length > 30 ? `${segment.note.slice(0, 30)} ...` : segment.note || ''}
											</td>
											<td>
												<Button color='secondary' onClick={() => {
													setEditingSegment({
														...segment,
														weekPatternsId: segment.weekPatternsId ?? -99,
														startTime: (segment.startTime === '-infinity' || segment.startTime === 'infinity')
															? segment.startTime
															: moment.utc(segment.startTime).format('YYYY-MM-DD HH:mm:ss'),
														endTime: (segment.endTime === '-infinity' || segment.endTime === 'infinity')
															? segment.endTime
															: moment.utc(segment.endTime).format('YYYY-MM-DD HH:mm:ss'),
														originalStartTime: segment.startTime,
														originalEndTime: segment.endTime
													});
													setFieldErrors({});
													setShowEditSegmentModal(true);
												}}>
													<FormattedMessage id='edit' />
												</Button>
											</td>
											<td><Button
												color='secondary'
												onClick={() => {
													setActionDirection('earlier');
													setSelectedSegment(segment);
													setActionDatetime('');
													setFieldErrors({});
													setShowSplitSegmentModal(true);
												}}
											>
												<FormattedMessage id='split.earlier' /></Button></td>
											<td><Button
												color='secondary'
												onClick={() => {
													setActionDirection('later');
													setSelectedSegment(segment);
													setActionDatetime('');
													setFieldErrors({});
													setShowSplitSegmentModal(true);
												}}
											>
												<FormattedMessage id='split.later' /></Button></td>
											<td>
												{segments.length !== 1 && segment.startTime !== '-infinity' && (
													<Button
														color='danger'
														size='sm'
														onClick={() => {
															setActionDirection('earlier');
															setSelectedSegment(segment);
															setWarningMessage(intl.formatMessage(
																{ id: 'conversion.delete.segment.earlier' },
																{ start: segment.startTime, end: segment.endTime }
															));
															setShowWarningModal(true);
														}}
													>
														<FormattedMessage id='delete.earlier' />
													</Button>
												)}
											</td>
											<td>
												{segments.length !== 1 && segment.endTime !== 'infinity' && (
													<Button
														color='danger'
														size='sm'
														onClick={() => {
															setActionDirection('later');
															setSelectedSegment(segment);
															setWarningMessage(intl.formatMessage(
																{ id: 'conversion.delete.segment.later' },
																{ start: segment.startTime, end: segment.endTime }
															));
															setShowWarningModal(true);
														}}
													>
														<FormattedMessage id='delete.later' />
													</Button>
												)}
											</td>
										</tr>
									))}
							</tbody>
						</Table>
						{!showAllSegments && segments.length !== 0 && (
							<Pagination aria-label='Segments Pagination' style={{ justifyContent: 'center', margin: '1% auto' }}>
								<>
									<PaginationItem disabled={currentPage === 1}>
										<PaginationLink first onClick={() => setCurrentPage(1)} />
									</PaginationItem>
									<PaginationItem disabled={currentPage === 1}>
										<PaginationLink previous onClick={() => setCurrentPage(currentPage - 1)} />
									</PaginationItem>

									{Array.from({ length: totalPages }, (_, index) => (
										<PaginationItem key={index + 1} active={currentPage === index + 1}>
											<PaginationLink onClick={() => setCurrentPage(index + 1)}>
												{index + 1}
											</PaginationLink>
										</PaginationItem>
									))}
									<PaginationItem disabled={currentPage === totalPages}>
										<PaginationLink next onClick={() => setCurrentPage(currentPage + 1)} />
									</PaginationItem>
									<PaginationItem disabled={currentPage === totalPages}>
										<PaginationLink last onClick={() => setCurrentPage(totalPages)} />
									</PaginationItem>
								</>
							</Pagination>
						)}
						<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1% auto' }}>
							{/* Show all logs or in pages button */}
							{segments.length > 0 &&
								<Button color='primary' onClick={() => setShowAllSegments(!showAllSegments)}>
									{!showAllSegments ? `${translate('show.all.segments')} (${segments.length})` : translate('show.in.pages')}
								</Button>}
						</div>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='danger' onClick={checkState}>
						<FormattedMessage id='conversion.overall.delete' />
					</Button>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id='conversion.overall.discard' />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button
						color='primary'
						onClick={handleSaveChanges}
						disabled={props.conversion.bidirectional === state.bidirectional && props.conversion.note === state.note}>
						<FormattedMessage id='conversion.overall.save' />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}