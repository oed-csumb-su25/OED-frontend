// EditDailyPatternModalComponent.tsx

import * as React from 'react';
import * as moment from 'moment-timezone';
import {
  Button, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter,
  ModalHeader, Row, Col, Table, Pagination, PaginationItem, PaginationLink,
  FormFeedback
} from 'reactstrap';
import { Day, DaySegment } from 'types/redux/days';

//
export interface Props {
  show: boolean;
  day: Day;
  handleClose: () => void;
}

// Segment interface extends DaySegment to include id and date range
interface Segment extends DaySegment {
  id: number;
  start: string;      // ISO | '-inf'
  end:   string;      // ISO | '+inf'
  pattern: string;
}

const PER_PAGE = 10;

/* spec‑accurate range text */
const tsFmt = (iso: string) =>
  moment.parseZone(iso).format('MMMM D, YYYY hh:mm:ss A');

const dateRange = (s: Segment) =>
  s.start === '-inf'
    ? `to ${tsFmt(s.end)}`
    : s.end === '+inf'
      ? `from ${tsFmt(s.start)}`
      : `${tsFmt(s.start)} to ${tsFmt(s.end)}`;

// Main component for editing daily patterns
// Displays a modal with a table of segments and options to edit, split, or delete them
export default function EditDailyPatternModalComponent({ show, day, handleClose }: Props) {

  const [segments, setSegments] = React.useState<Segment[]>(
    (day.segments as unknown as Segment[]) ?? []
  );

  /* --- TEMP DEMO ROWS -------------------------------------------------- */
  React.useEffect(() => {
    if (segments.length === 0) {
      setSegments([
        /* 1 ─ full dates, No Pattern */
        {
          id: 1,
          start: '2024-03-09T00:00:00Z',
          end:   '2025-01-02T00:00:00Z',
          slope: 123.45,
          intercept: 0,
          pattern: 'No Pattern',
          note: 'Sample with full dates and no pattern',
          dayId: 0,
          hour: 0
        },
        /* 2 ─ full dates, Weekly ABC */
        {
          id: 2,
          start: '2024-03-09T00:00:00Z',
          end:   '2025-01-02T00:00:00Z',
          slope: 0,
          intercept: 0,
          pattern: 'Weekly ABC',
          note: 'Sample with full dates and pattern',
          dayId: 0,
          hour: 0
        },
        /* 3 ─ from -∞ to a date */
        {
          id: 3,
          start: '-inf',
          end:   '2025-01-02T00:00:00Z',
          slope: 123.45,
          intercept: 0,
          pattern: 'No Pattern',
          note: 'Sample where it applies from -inf and no pattern',
          dayId: 0,
          hour: 0
        },
        /* 4 ─ from a date to +∞, Weekly XYZ */
        {
          id: 4,
          start: '2025-01-02T00:00:00Z',
          end:   '+inf',
          slope: 0,
          intercept: 0,
          pattern: 'Weekly XYZ',
          note: 'Sample where it applies to +inf and pattern',
          dayId: 0,
          hour: 0
        }
      ]);
    }
    
  }, []);
  

  // Pagination 
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(segments.length / PER_PAGE);
  const paged      = segments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Editing state
  const [editing, setEditing] = React.useState<Segment | null>(null);
  const [split, setSplit] = React.useState<{
    seg: Segment | null;
    dir: 'earlier' | 'later' | null;
    dt: string;
    err: string;
  }>({ seg: null, dir: null, dt: '', err: '' });

  // Update a segment field
  const upd = (id: number, field: keyof Segment, val: any) =>
    setSegments(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)));

  const deletePart = (seg: Segment, dir: 'earlier' | 'later') => {
    const mid = moment(seg.start).add(
      moment(seg.end).diff(moment(seg.start)) / 2
    ).toISOString();
    if (dir === 'earlier') upd(seg.id, 'start', mid);
    else                   upd(seg.id, 'end',   mid);
  };

  const splitNow = () => {
    if (!split.seg) return;
    const dt = moment(split.dt, 'YYYY-MM-DD HH:mm:ss', true);
    if (
      !dt.isValid() ||
      !dt.isBetween(moment(split.seg.start), moment(split.seg.end))
    ) {
      setSplit(m => ({ ...m, err: 'Must be inside current range' }));
      return;
    }
    const first  = { ...split.seg, end: dt.toISOString() };
    const second = { ...split.seg, start: dt.toISOString() };
    setSegments(prev =>
      prev
        .filter(s => s.id !== split.seg!.id)
        .concat(split.dir === 'earlier' ? [first, second] : [second, first])
        .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
    );
    setSplit({ seg: null, dir: null, dt: '', err: '' });
  };

  /* ── Render ───────────────────────────────────────────── */
  return (
    <>
      <Modal isOpen={show} toggle={handleClose} size="xl">
        <ModalHeader>Details/Edit Day</ModalHeader>

        <ModalBody>
          <Container>
            {/* Name and Note */}
            <Row>
              <Col>
                <FormGroup>
                  <Label>Name</Label>
                  <Input value={day.dayName} disabled />
                </FormGroup>
              </Col>
              <Col>
                <FormGroup>
                  <Label>Note</Label>
                  <Input value={day.note} disabled />
                </FormGroup>
              </Col>
            </Row>

            {/* Table */}
            <h5 className="mt-3 mb-2">Conversion Table</h5>
            <Table striped bordered>
              <thead>
                <tr>
                  <th>Date Range</th><th>Slope</th><th>Intercept</th>
                  <th>Pattern</th><th>Note</th>
                  <th>Edit</th><th>Split ↑</th><th>Split ↓</th><th>Del ↑</th><th>Del ↓</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(seg => (
                  <tr key={seg.id}>
                    <td>{dateRange(seg)}</td>
                    <td>{seg.pattern === 'No Pattern' ? seg.slope     : ''}</td>
                    <td>{seg.pattern === 'No Pattern' ? seg.intercept : ''}</td>
                    <td>{seg.pattern}</td>
                    <td>
                      {(seg.note ?? '').length > 100
                        ? (seg.note ?? '').slice(0, 100) + ' …'
                        : seg.note ?? ''}
                    </td>
                    <td><Button size="sm" onClick={() => setEditing(seg)}>Edit</Button></td>
                    <td><Button size="sm" onClick={() => setSplit({ seg, dir: 'earlier', dt: '', err: '' })}>Split ↑</Button></td>
                    <td><Button size="sm" onClick={() => setSplit({ seg, dir: 'later', dt: '', err: '' })}>Split ↓</Button></td>
                    <td><Button size="sm" color="danger" onClick={() => deletePart(seg, 'earlier')}>Del ↑</Button></td>
                    <td><Button size="sm" color="danger" onClick={() => deletePart(seg, 'later')}>Del ↓</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            {segments.length > PER_PAGE && (
              <Pagination style={{ justifyContent: 'center' }}>
                <PaginationItem disabled={page === 1}>
                  <PaginationLink first onClick={() => setPage(1)} />
                </PaginationItem>
                <PaginationItem disabled={page === 1}>
                  <PaginationLink previous onClick={() => setPage(p => p - 1)} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i} active={page === i + 1}>
                    <PaginationLink onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem disabled={page === totalPages}>
                  <PaginationLink next onClick={() => setPage(p => p + 1)} />
                </PaginationItem>
                <PaginationItem disabled={page === totalPages}>
                  <PaginationLink last onClick={() => setPage(totalPages)} />
                </PaginationItem>
              </Pagination>
            )}
          </Container>
        </ModalBody>

        <ModalFooter>
          <Button color="secondary" onClick={handleClose}>Cancel</Button>
          <Button color="primary" onClick={() => console.log('WOULD SAVE', segments)}>
            Save all
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit‑segment modal */}
      {editing && (
        <Modal isOpen toggle={() => setEditing(null)}>
          <ModalHeader>Edit Segment</ModalHeader>
          <ModalBody>
            <p><strong>{dateRange(editing)}</strong></p>
            <FormGroup>
              <Label>Slope</Label>
              <Input
                type="number"
                value={editing.slope}
                onChange={e => setEditing({ ...editing, slope: +e.target.value })}
                disabled={editing.pattern !== 'No Pattern'}
              />
            </FormGroup>
            <FormGroup>
              <Label>Intercept</Label>
              <Input
                type="number"
                value={editing.intercept}
                onChange={e => setEditing({ ...editing, intercept: +e.target.value })}
                disabled={editing.pattern !== 'No Pattern'}
              />
            </FormGroup>
            <FormGroup>
              <Label>Pattern</Label>
              <Input
                type="select"
                value={editing.pattern}
                onChange={e => setEditing({ ...editing, pattern: e.target.value })}
              >
                <option>No Pattern</option>
                <option>Weekly ABC</option>
                <option>Weekly XYZ</option>
              </Input>
            </FormGroup>
            <FormGroup>
              <Label>Note</Label>
              <Input
                type="textarea"
                value={editing.note}
                onChange={e => setEditing({ ...editing, note: e.target.value })}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button color="primary" onClick={() => {
              upd(editing.id, 'slope',     editing.slope);
              upd(editing.id, 'intercept', editing.intercept);
              upd(editing.id, 'pattern',   editing.pattern);
              upd(editing.id, 'note',      editing.note);
              setEditing(null);
            }}>Save</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Split modal */}
      {split.seg && (
        <Modal isOpen toggle={() => setSplit({ seg: null, dir: null, dt: '', err: '' })}>
          <ModalHeader>
            Split {split.dir === 'earlier' ? 'Earlier ↑' : 'Later ↓'}
          </ModalHeader>
          <ModalBody>
            <p>
              Enter datetime (YYYY‑MM‑DD HH:mm:ss) between<br />
              {dateRange(split.seg)}
            </p>
            <Input
              value={split.dt}
              placeholder="YYYY‑MM‑DD HH:mm:ss"
              onChange={e => setSplit(m => ({ ...m, dt: e.target.value, err: '' }))}
              invalid={Boolean(split.err)}
            />
            {split.err && <FormFeedback className="d-block">{split.err}</FormFeedback>}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setSplit({ seg: null, dir: null, dt: '', err: '' })}>
              Cancel
            </Button>
            <Button color="primary" onClick={splitNow}>Save</Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}