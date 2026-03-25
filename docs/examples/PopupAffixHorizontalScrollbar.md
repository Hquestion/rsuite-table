### Popup Container Affix

The horizontal scrollbar can now follow the nearest scrollable popup container automatically. You can also toggle an explicit container override.

<!--start-code-->

```js
const data = mockUsers(60);

const App = () => {
  const popupBodyRef = React.useRef(null);
  const [manualContainer, setManualContainer] = React.useState(false);

  return (
    <div
      style={{
        minHeight: 900,
        padding: 24,
        background: 'linear-gradient(180deg, #f6f4ef 0%, #eef2f6 100%)'
      }}
    >
      <VStack spacing={12}>
        <Checkbox
          checked={manualContainer}
          onChange={(_, checked) => {
            setManualContainer(checked);
          }}
        >
          Use `affixHorizontalScrollbarContainer`
        </Checkbox>

        <div style={{ color: '#575757' }}>
          Scroll inside the popup body. The horizontal scrollbar will stay attached to the popup
          container instead of the page viewport.
        </div>
      </VStack>

      <div
        style={{
          position: 'fixed',
          inset: '40px 60px auto auto',
          width: 820,
          background: '#fff',
          border: '1px solid #d9dde3',
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          zIndex: 20
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e5e9f0',
            fontWeight: 600,
            background: '#fbfcfd'
          }}
        >
          Popup body scroll container demo
        </div>

        <div
          ref={popupBodyRef}
          style={{
            height: 320,
            overflow: 'auto',
            position: 'relative',
            padding: 18,
            background: '#f8fafc'
          }}
        >
          <div
            style={{
              height: 140,
              marginBottom: 16,
              padding: 16,
              borderRadius: 12,
              background: '#fff6d8',
              color: '#6c5710'
            }}
          >
            Scroll down inside this popup body until the table bottom leaves the visible area.
            The table horizontal scrollbar should keep sticking to the popup body bottom.
          </div>

          <Table
            affixHorizontalScrollbar
            affixHorizontalScrollbarContainer={manualContainer ? popupBodyRef : undefined}
            data={data}
            height={360}
            bordered
            cellBordered
          >
            <Column width={80} align="center" fixed>
              <HeaderCell>ID</HeaderCell>
              <Cell dataKey="id" />
            </Column>

            <Column width={150}>
              <HeaderCell>First Name</HeaderCell>
              <Cell dataKey="firstName" />
            </Column>

            <Column width={150}>
              <HeaderCell>Last Name</HeaderCell>
              <Cell dataKey="lastName" />
            </Column>

            <Column width={220}>
              <HeaderCell>Company</HeaderCell>
              <Cell dataKey="company" />
            </Column>

            <Column width={220}>
              <HeaderCell>Street</HeaderCell>
              <Cell dataKey="street" />
            </Column>

            <Column width={200}>
              <HeaderCell>City</HeaderCell>
              <Cell dataKey="city" />
            </Column>

            <Column width={220}>
              <HeaderCell>Email</HeaderCell>
              <Cell dataKey="email" />
            </Column>
          </Table>

          <div
            style={{
              height: 420,
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              background: '#e9f5ff',
              color: '#1f4b6e'
            }}
          >
            This extra content keeps the popup body scrollable so you can verify that the
            affixed horizontal scrollbar stays inside the popup.
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />);
```

<!--end-code-->
