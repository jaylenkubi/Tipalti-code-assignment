import { MantineProvider, Title, Container, Text, Stack, MantineThemeOverride } from "@mantine/core";
import { useEffect, useState } from "react";
import axios from "axios";
import { MantineReactTable, MRT_ColumnDef, MRT_PaginationState } from 'mantine-react-table';

interface Transaction {
  id: number;
  date: string;
  amount: number;
  merchant: string;
  category: string;
}

interface ApiResponse {
  next: {
    page: number;
    limit: number;
  };
  totalPages: number;
  currentPage: number;
  transactions: Transaction[];
}

// Define theme for Mantine v6
const theme: MantineThemeOverride = {
  colorScheme: 'light' as const,
  primaryColor: 'blue',
  defaultRadius: 'sm',
};

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  
  // Use a single state object for pagination to ensure consistency
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Destructure for convenience
  const { pageIndex, pageSize } = pagination;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        // Add 1 to pageIndex because API is 1-indexed but table is 0-indexed
        const response = await axios.get<ApiResponse>(
          `https://tip-transactions.vercel.app/api/transactions?page=${pageIndex + 1}&limit=${pageSize}`
        );
        
        setTransactions(response.data.transactions);
        // Calculate total rows from totalPages and pageSize
        // This is an approximation if the API doesn't return the exact count
        setTotalRows(response.data.totalPages * pageSize);
        setIsLoading(false);
      } catch (err) {
        setIsError(true);
        setIsLoading(false);
        console.error('Error fetching transactions:', err);
      }
    };

    fetchTransactions();
  }, [pageIndex, pageSize]); // Re-fetch when pagination changes

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month} - ${day}/${month}/${year}`;
  };

  const columns: MRT_ColumnDef<Transaction>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 60,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      Cell: ({ cell }) => formatDate(cell.getValue<string>()),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      Cell: ({ cell }) => `£${cell.getValue<number>().toFixed(2)}`,
    },
    {
      accessorKey: 'merchant',
      header: 'Merchant',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
  ];
  
  const EmptyState = () => (
    <Stack align="center" spacing="sm" style={{ padding: '40px', color: '#666' }}>
      <Text weight={500} size="lg">No Expenses Found</Text>
      <Text size="sm">There are no expenses to display at this time.</Text>
    </Stack>
  );
  
  return (
    <MantineProvider theme={theme}>
      <Container size="lg" py="xl">
        <Title order={1} align="center" mb="xl" style={{ fontSize: '24px' }}>Expenses</Title>
        
        <MantineReactTable
          columns={columns}
          data={transactions}
          enableColumnOrdering
          enableHiding={false}
          enableColumnDragging={false}
          enableDensityToggle={false}
          enableGlobalFilter={false}
          enableFullScreenToggle={false}
          manualPagination
          enablePagination={true}
          rowCount={totalRows}
          onPaginationChange={setPagination}
          state={{
            pagination,
            isLoading,
            showAlertBanner: isError,
            showProgressBars: isLoading,
          }}
          mantineTableProps={{
            highlightOnHover: true,
          }}
          mantineToolbarAlertBannerProps={
            isError
              ? {
                  color: 'red',
                  children: 'Error loading data. Please try again later.',
                }
              : undefined
          }
          renderEmptyRowsFallback={EmptyState}
          mantineTableHeadCellProps={{
            style: {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
              padding: '10px',
              textAlign: 'left'
            },
          }}
        />
      </Container>
    </MantineProvider>
  );
}

export default App;
