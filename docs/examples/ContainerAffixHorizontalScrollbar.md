### Container Affix Horizontal Scrollbar

When the table is rendered inside a scrollable container, the affixed horizontal scrollbar follows the nearest vertical scroll container instead of the page.

<!--start-code-->

```js
const data = mockUsers(20);

const App = () => {
  return (
    <div style={{ padding: 24, background: '#f5f5f5' }}>
      <div
        style={{
          width: 760,
          margin: '0 auto',
          border: '1px solid #ddd',
          borderRadius: 8,
          background: '#fff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontWeight: 600 }}>
          Popup Body
        </div>
        <div style={{ height: 320, overflowY: 'auto', overflowX: 'hidden', padding: 20 }}>
          <div style={{ height: 180, color: '#777' }}>Scroll inside this container</div>
          <Table affixHorizontalScrollbar data={data} height={220}>
            <Column width={100} fixed resizable>
              <HeaderCell>Id</HeaderCell>
              <Cell dataKey="id" />
            </Column>

            <Column width={160} resizable>
              <HeaderCell>First Name</HeaderCell>
              <Cell dataKey="firstName" />
            </Column>

            <Column width={160} resizable>
              <HeaderCell>Last Name</HeaderCell>
              <Cell dataKey="lastName" />
            </Column>

            <Column width={220} resizable>
              <HeaderCell>City</HeaderCell>
              <Cell dataKey="city" />
            </Column>

            <Column width={220} resizable>
              <HeaderCell>Street</HeaderCell>
              <Cell dataKey="street" />
            </Column>

            <Column width={220}>
              <HeaderCell>Email</HeaderCell>
              <Cell dataKey="email" />
            </Column>
          </Table>
          <div style={{ height: 240 }} />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />);
```

<!--end-code-->
